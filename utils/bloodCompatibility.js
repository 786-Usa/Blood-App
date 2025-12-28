export const bloodCompatibility = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["A-", "B-", "AB-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"]
};

/**
 * Checks if donor blood is compatible with recipient
 */
export const isBloodCompatible = (recipientBlood, donorBlood) => {
  if (!recipientBlood || !donorBlood) return false;

  const normalize = (b) => {
    return b
      .toString()          // String mein convert karein
      .toUpperCase()       // Capitalize karein
      .trim()              // Spaces khatam karein
      .replace(/0/g, "O"); // 🔥 ZERO KO ALPHABET "O" SE BADAL DEIN
  };

  const r = normalize(recipientBlood);
  const d = normalize(donorBlood);

  // Debug log taake aapko tasalli ho jaye
  console.log(`Normalizing: Recipient(${r}) - Donor(${d})`);

  return bloodCompatibility[r]?.includes(d) || false;
};

