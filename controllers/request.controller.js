import { BloodRequest } from "../models/BloodRequest.model.js";
import { User } from "../models/User.model.js";
import { bloodCompatibility } from "../utils/bloodCompatibility.js";
import { radiusSteps } from "../utils/radiusLogic.js";
 import { DonationHistory } from "../models/DonationHistory.model.js";
import { io } from "../server.js";


const createRequest = async (req, res) => {
  // Prevent multiple active SOS
const existingRequest = await BloodRequest.findOne({
  recipientId: req.user.id,
  status: "pending"
});

if (existingRequest) {
  return res.status(400).json({
    message: "You already have an active SOS request"
  });
}

  const { bloodGroup, latitude, longitude } = req.body;

  const compatibleGroups = bloodCompatibility[bloodGroup];
  let matchedDonors = [];

  for (let radius of radiusSteps) {
    const donors = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          maxDistance: radius,
          distanceField: "distance",
          spherical: true
        }
      },
      {
        $match: {
          role: "donor",
          availabilityStatus: "available",
          bloodGroup: { $in: compatibleGroups }
        }
      },
      { $limit: 5 }
    ]);

    matchedDonors.push(...donors);

    if (matchedDonors.length >= 3) break;
  }

  const request = await BloodRequest.create({
    recipientId: req.user.id,
    bloodGroup,
    location: {
      coordinates: [longitude, latitude]
    },
    donorResponses: matchedDonors.map(donor => ({
      donorId: donor._id,
      response: "pending"
    }))
  });

  // REAL-TIME SOS ALERT TO DONORS
request.donorResponses.forEach(donor => {
  io.to(donor.donorId.toString()).emit("new-sos", {
    requestId: request._id,
    bloodGroup: request.bloodGroup,
    message: "Emergency blood request nearby"
  });
});

  res.status(201).json({
    message: "SOS request created",
    request
  });
};


 const respondToRequest = async (req, res) => {
  const { requestId, response } = req.body;
  const donorId = req.user.id;

  const request = await BloodRequest.findById(requestId);

  if (!request || request.status !== "pending") {
    return res.status(400).json({ message: "Request already closed" });
  }
  if (donorResponse.response !== "pending") {
  return res.status(400).json({
    message: "You have already responded to this request"
  });
}


  const donorResponse = request.donorResponses.find(
    d => d.donorId.toString() === donorId
  );

  if (!donorResponse) {
    return res.status(403).json({ message: "Not authorized for this request" });
  }

  donorResponse.response = response;

  // FIRST ACCEPT WINS
  if (response === "accepted") {
    request.status = "fulfilled";
    request.fulfilledBy = donorId;
    request.fulfilledAt = new Date();

    // Save donation history
    await DonationHistory.create({
      donorId,
      recipientId: request.recipientId,
      donationDate: new Date(),
      location: "Emergency Donation"
    });
    await User.findByIdAndUpdate(donorId, {
  availabilityStatus: "busy"
});
  }

  await request.save();

  // Notify recipient in real-time
io.to(request.recipientId.toString()).emit("sos-update", {
  requestId: request._id,
  status: request.status,
  donorId
});

if (new Date() > request.expiresAt) {
  request.status = "cancelled";
  await request.save();

  return res.status(400).json({
    message: "SOS request has expired"
  });
}



  res.json({ message: `Request ${response}` });
};

 const cancelRequest = async (req, res) => {
  const { requestId } = req.body;

  const request = await BloodRequest.findOne({
    _id: requestId,
    recipientId: req.user.id
  });

  if (!request || request.status !== "pending") {
    return res.status(400).json({
      message: "Request cannot be cancelled"
    });
  }

  request.status = "cancelled";
  await request.save();

  res.json({ message: "SOS request cancelled successfully" });
};



export {
  createRequest,
  respondToRequest,
  cancelRequest
}




// WHY THIS LOGIC IS IMPORTANT (VIVA GOLD)

// You can confidently say:

// “To avoid multiple donors responding to the same emergency, the system locks the request after the first acceptance. This ensures data consistency and real-world feasibility.”