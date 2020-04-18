export const RES_SUCCESS = {
  hasError: false,
  status: "OK",
};

export const RES_FAILURE = {
  hasError: true,
  status: "Server error",
};

export const RES_UNAUTHORIZED = {
  hasError: true,
  status: "Unauthorized",
};

export const RES_ERROR = {
  hasError: true,
  status: "App Error",
};

export const RES_VALIDATION_FAILURE = {
  hasError: true,
  status: "Server error",
  message: "Validation failure",
};
