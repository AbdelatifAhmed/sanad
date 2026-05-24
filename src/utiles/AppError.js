class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static catchAsync(fn) {
    return (req, res, next) => fn(req, res, next).catch(next);
  }

  static globalErrorHandler(err, req, res, next) {
    let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
    error.message = err.message;

    if (error.name === "CastError")
      error = new AppError(`Invalid ${error.path}: ${error.value}.`, 400);

    if (error.code === 11000) {
      const value = error.errmsg?.match(/([\"'])(\\?.)*?\1/)?.[0] ?? "";
      error = new AppError(`Duplicate field value: ${value}. Please use another value!`, 409);
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message).join(". ");
      error = new AppError(`Invalid input data. ${messages}`, 400);
    }

    error.statusCode = error.statusCode || 500;
    error.status = error.status || "error";

    if (process.env.NODE_ENV === "development") {
      return res.status(error.statusCode).json({
        status: error.status,
        error,
        message: error.message,
        stack: error.stack,
      });
    }

    if (!error.isOperational) {
      console.error("ERROR 💥", error);
      return res.status(500).json({ status: "error", message: "Something went wrong!" });
    }

    res.status(error.statusCode).json({ status: error.status, message: error.message });
  }
}

module.exports = AppError;