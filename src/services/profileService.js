const PROFILE_ENDPOINTS = {
  farmer: "https://agrofarm-vd8i.onrender.com/api/farmers/me",
  buyer: "https://agrofarm-vd8i.onrender.com/api/buyers/me",
  supplier: "https://agrofarm-vd8i.onrender.com/api/suppliers/me",
};

export async function fetchProfileForRole(role) {
  const endpoint = PROFILE_ENDPOINTS[role];
  if (!endpoint) {
    throw new Error("Unsupported role");
  }

  const response = await fetch(endpoint, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch profile");
  }

  const data = await response.json();
  const {
    name = "",
    email = "",
    phone = "",
    address = "",
    img = "",
  } = data.user || {};

  return { name, email, phone, address, img };
}
