// import { BloodRequest } from "../models/BloodRequest.model.js";
// import { User } from "../models/User.model.js";
// import { bloodCompatibility } from "../utils/bloodCompatibility.js";
// import { radiusSteps } from "../utils/radiusLogic.js";
//  import { DonationHistory } from "../models/DonationHistory.model.js";
// import { io } from "../server.js";

// const createRequest = async (req, res) => {
//   // Prevent multiple active SOS
// const existingRequest = await BloodRequest.findOne({
//   recipientId: req.user.id,
//   status: "pending"
// });

// if (existingRequest) {
//   return res.status(400).json({
//     message: "You already have an active SOS request"
//   });
// }

//   const { bloodGroup, latitude, longitude } = req.body;

//   const compatibleGroups = bloodCompatibility[bloodGroup];
//   let matchedDonors = [];

//   for (let radius of radiusSteps) {
//     const donors = await User.aggregate([
//       {
//         $geoNear: {
//           near: {
//             type: "Point",
//             coordinates: [longitude, latitude]
//           },
//           maxDistance: radius,
//           distanceField: "distance",
//           spherical: true
//         }
//       },
//       {
//         $match: {
//           role: "donor",
//           availabilityStatus: "available",
//           bloodGroup: { $in: compatibleGroups }
//         }
//       },
//       { $limit: 5 }
//     ]);

//     matchedDonors.push(...donors);

//     if (matchedDonors.length >= 3) break;
//   }

//   const request = await BloodRequest.create({
//     recipientId: req.user.id,
//     bloodGroup,
//     location: {
//       coordinates: [longitude, latitude]
//     },
//     donorResponses: matchedDonors.map(donor => ({
//       donorId: donor._id,
//       response: "pending"
//     }))
//   });

//   // REAL-TIME SOS ALERT TO DONORS
// request.donorResponses.forEach(donor => {
//   io.to(donor.donorId.toString()).emit("new-sos", {
//     requestId: request._id,
//     bloodGroup: request.bloodGroup,
//     message: "Emergency blood request nearby"
//   });
// });

//   res.status(201).json({
//     message: "SOS request created",
//     request
//   });
// };

// const respondToRequest = async (req, res) => {
//   try {
//     const { requestId, response } = req.body; // response: "accepted" or "rejected"
//     const donorId = req.user.id;

//     // 1. Request find karein
//     const request = await BloodRequest.findById(requestId);

//     // 2. Basic Validation (Exist karti hai?)
//     if (!request) {
//       return res.status(404).json({ message: "Request not found" });
//     }

//     // 3. Check Expiry (Action lene se pehle check karein)
//     if (request.expiresAt && new Date() > request.expiresAt) {
//       request.status = "cancelled";
//       await request.save();
//       return res.status(400).json({ message: "SOS request has expired" });
//     }

//     // 4. Check Status (Kya request abhi bhi pending hai?)
//     if (request.status !== "pending") {
//       return res.status(400).json({ message: "Request is no longer active or already fulfilled" });
//     }

//     // 5. Find specific donor in the list
//     const donorResponseEntry = request.donorResponses.find(
//       (d) => d.donorId.toString() === donorId
//     );

//     // 6. Check Authorization (Kya ye donor is SOS list mein tha?)
//     if (!donorResponseEntry) {
//       return res.status(403).json({ message: "You are not authorized to respond to this request" });
//     }

//     // 7. Check if already responded
//     if (donorResponseEntry.response !== "pending") {
//       return res.status(400).json({ message: "You have already responded to this request" });
//     }

//     // 8. Update Donor's specific response
//     donorResponseEntry.response = response;

//     // 9. "First Accept Wins" Logic
//     if (response === "accepted") {
//       request.status = "fulfilled";
//       request.fulfilledBy = donorId;
//       request.fulfilledAt = new Date();

//       // Create Donation History record
//       await DonationHistory.create({
//         donorId,
//         recipientId: request.recipientId,
//         donationDate: new Date(),
//         location: request.hospitalName || "Emergency Donation", // Agar hospital name model mein hai
//       });

//       // Update donor availability to busy
//       await User.findByIdAndUpdate(donorId, {
//         availabilityStatus: "busy",
//       });
//     }

//     // 10. Save all changes
//     await request.save();

//     // 11. Real-time Notification via Socket.io
//     // Recipient ko batayein ke status update ho gaya hai
//     io.to(request.recipientId.toString()).emit("sos-update", {
//       requestId: request._id,
//       status: request.status,
//       donorId: response === "accepted" ? donorId : null,
//     });

//     return res.json({
//       message: `Request successfully ${response}`,
//       status: request.status
//     });

//   } catch (error) {
//     console.error("Respond Request Error:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

//  const cancelRequest = async (req, res) => {
//   const { requestId } = req.body;

//   const request = await BloodRequest.findOne({
//     _id: requestId,
//     recipientId: req.user.id
//   });

//   if (!request || request.status !== "pending") {
//     return res.status(400).json({
//       message: "Request cannot be cancelled"
//     });
//   }

//   request.status = "cancelled";
//   await request.save();

//   res.json({ message: "SOS request cancelled successfully" });
// };

// export {
//   createRequest,
//   respondToRequest,
//   cancelRequest
// }

// WHY THIS LOGIC IS IMPORTANT (VIVA GOLD)

// You can confidently say:

// “To avoid multiple donors responding to the same emergency, the system locks the request after the first acceptance. This ensures data consistency and real-world feasibility.”

//2

import { BloodRequest } from "../models/BloodRequest.model.js";
import { User } from "../models/User.model.js";
import mongoose from "mongoose"; // 👈 Ye line add karein
import { DonationHistory } from "../models/DonationHistory.model.js";
import { isBloodCompatible } from "../utils/bloodCompatibility.js";
import { getSearchRadius } from "../utils/radiusLogic.js";
import { checkEligibility } from "../utils/eligibility.js";

/* =====================================================
   CREATE SOS REQUEST
===================================================== */
const createRequest = async (req, res) => {
  try {
    const {
      bloodGroup,
      urgencyLevel,
      hospital,
      units,
      notes,
      location,
      latitude,
      longitude,
    } = req.body;

    // ✅ Normalize coordinates (support both payload styles)
    const lng =
      typeof longitude === "number" ? longitude : location?.coordinates?.[0];

    const lat =
      typeof latitude === "number" ? latitude : location?.coordinates?.[1];

    // ✅ HARD validation (DO NOT REMOVE)
    if (!bloodGroup || typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({
        message: "Invalid request data or location missing",
      });
    }

    // 1️⃣ Prevent multiple active SOS
    const activeRequest = await BloodRequest.findOne({
      recipientId: req.user.id,
      status: "pending",
    });

    if (activeRequest) {
      return res.status(400).json({
        message: "You already have an active SOS request",
      });
    }

    // 2️⃣ Create SOS
    const request = await BloodRequest.create({
      recipientId: req.user.id,
      hospital,
      bloodGroup,
      units,
      urgencyLevel,
      notes,
      status: "pending",
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
    });

    res.status(201).json({
      message: "SOS request created successfully",
      requestId: request._id,
    });

    /* =====================================================
       5️⃣ DONOR MATCHING (ASYNC – SAFE)
    ===================================================== */
    let matchedDonors = [];

    for (let step = 0; step < 3; step++) {
      const radius = getSearchRadius(step);

      const donors = await User.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [lng, lat],
            },
            distanceField: "distance",
            maxDistance: radius,
            spherical: true,
            query: {
              role: "donor",
              availabilityStatus: "available",
              isBlocked: false,
            },
          },
        },
      ]);

      const eligible = donors.filter((donor) => {
        const bloodOk = isBloodCompatible(bloodGroup, donor.bloodGroup);
        const { eligible } = checkEligibility(
          donor.lastDonationDate,
          donor.gender
        );
        return bloodOk && eligible;
      });

      matchedDonors.push(...eligible);
      if (matchedDonors.length >= 3) break;
    }

    if (matchedDonors.length === 0) return;

    /* 6️⃣ UPDATE REQUEST WITH DONORS */
    request.donorResponses = matchedDonors.map((d) => ({
      donorId: d._id,
      response: "pending",
    }));
    await request.save();

    /* 7️⃣ SOCKET ALERT (Updated Logic) */
    /* 7️⃣ SOCKET ALERT */
    const io = req.app.get("socketio"); // 👈 Yeh line zaroori hai!

    if (io) {
  request.donorResponses.forEach((d) => {
    const roomId = d.donorId.toString();
    console.log("🚀 Emitting SOS to:", roomId);

    io.to(roomId).emit("new-sos", {
      requestId: request._id,
      bloodGroup,
      urgencyLevel,
    });
  });
}
  } catch (error) {
    console.error("Create SOS Error:", error);
  }
};

/* =====================================================
   RESPOND TO SOS (DONOR)
===================================================== */
const respondToRequest = async (req, res) => {
  try {
    const { requestId, response } = req.body;
    const donorId = req.user.id;
    
    // 🚨 YAHAN CHECK KAREIN: Kya aapne io sahi fetch kiya hai?
    const io = req.app.get("socketio"); 

    const request = await BloodRequest.findOneAndUpdate(
      { _id: requestId, status: "pending" },
      {
        $set: {
          "donorResponses.$.response": response,
          ...(response === "accepted" && {
            status: "fulfilled",
            fulfilledBy: donorId,
            fulfilledAt: new Date(),
          }),
        },
      },
      { new: true }
    );

    if (!request) return res.status(400).json({ message: "Not found" });

    // 🚨 RECIPIENT KO SIGNAL BHEJNA
    if (io) {
      const recipientRoom = request.recipientId.toString();
      console.log(`📡 Emitting to Recipient Room: ${recipientRoom}`); // Check this log in Backend Terminal
      
      io.to(recipientRoom).emit("sos-update", {
        requestId: request._id,
        status: request.status, // Yeh 'fulfilled' hona chahiye
      });
    }

    res.json({ message: "Success", status: request.status });
  } catch (error) {
    console.error(error);
  }
};

/* =====================================================
   CANCEL SOS (RECIPIENT)
===================================================== */
const cancelRequest = async (req, res) => {
  const { requestId } = req.body;

  const request = await BloodRequest.findOneAndUpdate(
    {
      _id: requestId,
      recipientId: req.user.id,
      status: "pending",
    },
    { status: "cancelled" },
    { new: true }
  );

  if (!request) {
    return res.status(400).json({
      message: "Request cannot be cancelled",
    });
  }

  res.json({ message: "SOS request cancelled successfully" });
};

/* =====================================================
   ARRIVAL CONFIRMATION (DONOR)
   Endpoint: POST /request/arrived
   Body: { requestId }
===================================================== */
const arrivalConfirmation = async (req, res) => {
  try {
    const { requestId } = req.body;
    const donorId = req.user.id;

    const request = await BloodRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (!request.fulfilledBy || request.fulfilledBy.toString() !== donorId.toString()) {
      return res.status(403).json({ message: "You are not the assigned donor for this request" });
    }

    const io = req.app.get("socketio");
    if (io) {
      io.to(request.recipientId.toString()).emit("donor-arrived", {
        requestId: request._id,
        donorId,
      });
    }

    res.json({ message: "Arrival confirmed" });
  } catch (err) {
    console.error("Arrival Confirmation Error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* =====================================================
   MARK AS DONATED / COMPLETE (DONOR)
   Endpoint: POST /request/complete
   Body: { requestId }
===================================================== */
const markAsDonated = async (req, res) => {
  try {
    const { requestId } = req.body;
    const donorId = req.user.id;

    // Only allow marking complete if this donor fulfilled the request and request is fulfilled
    const request = await BloodRequest.findOne({ _id: requestId, status: "fulfilled", fulfilledBy: donorId });
    if (!request) return res.status(400).json({ message: "Request not found or not authorized" });

    // Create donation history
    await DonationHistory.create({
      donorId,
      recipientId: request.recipientId,
      donationDate: new Date(),
      location: request.hospital || "Emergency Donation",
    });

    // Update donor record
    await User.findByIdAndUpdate(donorId, { lastDonationDate: new Date(), availabilityStatus: "available" });

    // Update request status to completed
    request.status = "completed";
    request.completedAt = new Date();
    await request.save();

    const io = req.app.get("socketio");
    if (io) {
      io.to(request.recipientId.toString()).emit("sos-completed", { requestId: request._id });
      io.to(donorId.toString()).emit("sos-completed", { requestId: request._id });
    }

    res.json({ message: "Donation marked as completed" });
  } catch (err) {
    console.error("Mark As Donated Error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* =====================================================
   GET MY REQUESTS
===================================================== */
const getMyRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({
      recipientId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(requests);
  } catch {
    res.status(500).json({ message: "Error fetching requests" });
  }
};

/* =====================================================
   GET REQUEST BY ID
===================================================== */
const getRequestById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid request ID" });
  }

  const request = await BloodRequest.findOne({
    _id: id,
    recipientId: req.user.id,
  });

  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  res.json(request);
};

export {
  createRequest,
  respondToRequest,
  cancelRequest,
  getMyRequests,
  getRequestById,
  arrivalConfirmation,
  markAsDonated,
};
