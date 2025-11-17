import { createSlice } from "@reduxjs/toolkit";

const persistedUser =
  typeof window !== "undefined"
    ? JSON.parse(window.localStorage.getItem("fc_user") || "{}")
    : {};

const initialState = {
  name: persistedUser.name || "",
  img: persistedUser.img || "",
};

const persistState = (state) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      "fc_user",
      JSON.stringify({ name: state.name, img: state.img })
    );
  }
};

const clearPersistedState = () => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("fc_user");
  }
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action) {
      state.name = action.payload?.name || "";
      state.img = action.payload?.img || "";
      persistState(state);
    },
    clearUser(state) {
      state.name = "";
      state.img = "";
      clearPersistedState();
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
