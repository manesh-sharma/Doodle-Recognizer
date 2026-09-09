export function getSavedUser() {
  try {
    return JSON.parse(
      localStorage.getItem("doodlesense_user_session")
    ) || {
      loggedIn: false,
      username: null
    };
  } catch {
    return {
      loggedIn: false,
      username: null
    };
  }
}

export function getSavedHistory() {
  try {
    return JSON.parse(
      localStorage.getItem("doodlesense_app_history")
    ) || [];
  } catch {
    return [];
  }
}