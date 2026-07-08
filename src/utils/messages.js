const messages = {
  common: {
    serverError: {
      en: "Internal Server Error",
      ar: "حدث خطأ داخلي في الخادم"
    },
    unauthorized: {
      en: "Authentication required.",
      ar: "مطلوب تسجيل الدخول أولاً."
    },
    forbidden: {
      en: "Access denied. Insufficient permissions.",
      ar: "تم رفض الوصول. ليس لديك صلاحية كافية."
    },
    invalidId: {
      en: "Invalid ID format.",
      ar: "صيغة المعرف غير صالحة."
    },
    notFound: {
      en: "Resource not found.",
      ar: "المصدر غير موجود."
    }
  },
  auth: {
    requiredFields: {
      en: "All account fields are required.",
      ar: "جميع حقول الحساب مطلوبة."
    },
    locationRequired: {
      en: "Geospatial location coordinates are required.",
      ar: "إحداثيات الموقع الجغرافي مطلوبة."
    },
    emailRegistered: {
      en: "Email is already registered.",
      ar: "البريد الإلكتروني مسجل بالفعل."
    },
    registerSuccess: {
      en: "Account registered successfully.",
      ar: "تم تسجيل الحساب بنجاح."
    },
    invalidCredentials: {
      en: "Invalid credentials.",
      ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة."
    },
    banned: {
      en: "Your account has been banned. Access denied.",
      ar: "تم حظر حسابك. لا يمكن الدخول."
    },
    loginSuccess: {
      en: "Logged in successfully.",
      ar: "تم تسجيل الدخول بنجاح."
    },
    invalidToken: {
      en: "Invalid or expired token.",
      ar: "رمز التحقق غير صالح أو منتهي الصلاحية."
    },
    logoutSuccess: {
      en: "Logged out successfully.",
      ar: "تم تسجيل الخروج بنجاح."
    },
    invalidEmail: {
      en: "Please provide a valid email address.",
      ar: "يرجى تقديم عنوان بريد إلكتروني صالح."
    },
    weakPassword: {
      en: "Password must be at least 8 characters long, containing at least one uppercase letter, one lowercase letter, one number, and one symbol.",
      ar: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل، وتحتوي على حرف كبير، وحرف صغير، ورقم، ورمز خاص واحد على الأقل."
    },
    rateLimited: {
      en: "Too many attempts, please try again later.",
      ar: "محاولات كثيرة جداً، يرجى المحاولة مرة أخرى لاحقاً."
    },
    passwordResetCodeSent: {
      en: "Password reset code sent to your email.",
      ar: "تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني."
    },
    invalidOtp: {
      en: "Invalid or expired OTP code.",
      ar: "رمز التحقق غير صالح أو منتهي الصلاحية."
    },
    passwordResetSuccess: {
      en: "Password has been reset successfully.",
      ar: "تم إعادة تعيين كلمة المرور بنجاح."
    },
    passwordChangedSuccess: {
      en: "Password has been changed successfully.",
      ar: "تم تغيير كلمة المرور بنجاح."
    },
    incorrectCurrentPassword: {
      en: "Current password is incorrect.",
      ar: "كلمة المرور الحالية غير صحيحة."
    },
    accountDeleted: {
      en: "Account has been deleted successfully.",
      ar: "تم حذف الحساب بنجاح."
    }
  },
  booking: {
    accessDeniedFamilyOnly: {
      en: "Access denied. Only family accounts can create bookings.",
      ar: "تم رفض الوصول. يمكن لعائلات المرضى فقط إنشاء حجوزات."
    },
    missingFields: {
      en: "Missing required booking fields.",
      ar: "بعض الحقول المطلوبة للحجز مفقودة."
    },
    invalidHours: {
      en: "Total hours must be a number greater than 0.",
      ar: "عدد الساعات الكلي يجب أن يكون رقماً أكبر من 0."
    },
    invalidSchedule: {
      en: "Schedule must be a non-empty array with valid date, startTime, and endTime.",
      ar: "يجب تحديد جدول عمل يحتوي على التواريخ وأوقات البدء والانتهاء."
    },
    profileNotFound: {
      en: "Family profile not found.",
      ar: "لم يتم العثور على ملف العائلة الخاص بك."
    },
    beneficiaryNotFound: {
      en: "Beneficiary not found inside your family profile.",
      ar: "المستفيد غير موجود في ملف العائلة الخاص بك."
    },
    companionNotFound: {
      en: "Companion user or profile not found.",
      ar: "لم يتم العثور على حساب أو ملف المرافق المطلوب."
    },
    companionNotVerified: {
      en: "Companion is not verified.",
      ar: "حساب المرافق غير موثق بعد من الإدارة."
    },
    conflict: {
      en: "Sorry, this companion has another confirmed booking that overlaps with the requested dates or hours.",
      ar: "عذراً، هذا المرافق لديه حجز مؤكد آخر يتداخل مع التواريخ أو الساعات المطلوبة."
    },
    successCreated: {
      en: "Direct booking request has been successfully sent to the companion and is pending approval.",
      ar: "تم إرسال طلب الحجز المباشر للمرافق بنجاح وفي انتظار موافقته."
    },
    statusRequired: {
      en: "status is required",
      ar: "حالة الحجز مطلوبة"
    },
    invalidStatus: {
      en: "Invalid booking status.",
      ar: "حالة الحجز غير صالحة."
    },
    updateStatusDenied: {
      en: "Access denied. You can only update status for your own bookings.",
      ar: "تم رفض الوصول. يمكنك فقط تحديث حالة الحجوزات الخاصة بك."
    },
    updateStatusRoleLimit: {
      en: "Access denied. Invalid role for status transition.",
      ar: "تم رفض الوصول. دور الحساب لا يسمح بتحديث الحالة."
    },
    invalidTransition: {
      en: "Cannot transition booking status.",
      ar: "لا يمكن الانتقال لحالة الحجز المطلوبة."
    },
    statusUpdated: {
      en: "Booking status updated successfully.",
      ar: "تم تحديث حالة الحجز بنجاح."
    },
    checkInSuccess: {
      en: "Check-in successful.",
      ar: "تم تسجيل حضور المرافق بنجاح."
    },
    checkOutSuccess: {
      en: "Check-out successful.",
      ar: "تم تسجيل انصراف المرافق بنجاح."
    },
    checkInConflict: {
      en: "Already checked in for this schedule day.",
      ar: "تم تسجيل الحضور بالفعل لهذا اليوم."
    },
    checkOutConflict: {
      en: "Already checked out for this schedule day.",
      ar: "تم تسجيل الانصراف بالفعل لهذا اليوم."
    },
    checkOutBeforeIn: {
      en: "Must check in first before checking out.",
      ar: "يجب تسجيل الحضور أولاً قبل تسجيل الانصراف."
    },
    notAuthorizedCheckInOut: {
      en: "Not authorized to check-in/out for this booking.",
      ar: "غير مصرح لك بتسجيل الحضور أو الانصراف لهذا الحجز."
    },
    bookingCompletedOrCancelled: {
      en: "Cannot check-in. Booking is already completed or cancelled.",
      ar: "لا يمكن تسجيل الحضور. الحجز مكتمل أو ملغي بالفعل."
    },
    scheduleNotFound: {
      en: "Schedule day not found.",
      ar: "يوم الحجز المطلوب غير موجود بالجدول."
    },
    bookingUpdatedNotification: {
      en: "Your booking request status has been updated.",
      ar: "تم تحديث حالة طلب الحجز الخاص بك."
    },
    bookingNotificationText: {
      en: "Your booking request has been updated.",
      ar: "تم تحديث طلب الحجز الخاص بك."
    },
    taskStatusRequired: {
      en: "isCompleted is required.",
      ar: "حالة اكتمال المهمة مطلوبة."
    },
    bookingOrScheduleNotFound: {
      en: "Booking or Schedule day not found.",
      ar: "الحجز أو يوم الجدول غير موجود."
    },
    taskStatusUpdated: {
      en: "Task status updated successfully.",
      ar: "تم تحديث حالة المهمة بنجاح."
    }
  },
  companion: {
    bioRequired: {
      en: "Bio is required to initialize a companion profile.",
      ar: "السيرة الذاتية مطلوبة لتهيئة ملف المرافق."
    },
    hourlyRateRequired: {
      en: "Hourly rate is required to initialize a companion profile and must be a positive number.",
      ar: "سعر الساعة مطلوب لتهيئة ملف المرافق ويجب أن يكون رقماً إيجابياً."
    },
    skillsArray: {
      en: "Skills must be an array of strings.",
      ar: "يجب أن تكون المهارات قائمة من النصوص."
    },
    hobbiesArray: {
      en: "Hobbies must be an array of strings.",
      ar: "يجب أن تكون الهوايات قائمة من النصوص."
    },
    invalidAvailability: {
      en: "Availability must be an array of valid days and slots.",
      ar: "يجب أن يكون جدول التواجد قائمة من الأيام والأوقات الصالحة."
    },
    profileSuccess: {
      en: "Companion profile updated successfully.",
      ar: "تم تحديث ملف تعريف المرافق بنجاح."
    },
    profileNotFound: {
      en: "Companion profile not found.",
      ar: "لم يتم العثور على ملف تعريف المرافق الخاص بك."
    },
    availabilitySuccess: {
      en: "Availability schedule updated successfully.",
      ar: "تم تحديث جدول مواعيد تواجدك بنجاح."
    },
    companionDetailsSuccess: {
      en: "Companion details retrieved successfully.",
      ar: "تم جلب تفاصيل المرافق بنجاح."
    }
  },
  family: {
    atLeastOneField: {
      en: "At least one of address or beneficiaries must be provided for update.",
      ar: "يجب توفير العنوان أو المستفيدين على الأقل لتحديث الملف."
    },
    invalidAddress: {
      en: "Address must be a valid object.",
      ar: "يجب أن يكون العنوان كائناً صالحاً."
    },
    invalidBeneficiaries: {
      en: "Beneficiaries must be a valid array.",
      ar: "يجب أن تكون قائمة المستفيدين صالحة."
    },
    profileSuccess: {
      en: "Family profile updated successfully.",
      ar: "تم تحديث ملف العائلة بنجاح."
    }
  },
  jobPost: {
    missingFields: {
      en: "All basic fields including title, description, serviceType, budgetPerHour, location, and schedule are required.",
      ar: "جميع الحقول الأساسية بما فيها العنوان والوصف ونوع الخدمة وسعر الساعة والموقع والجدول مطلوبة."
    },
    invalidSchedule: {
      en: "Job schedule details (working days, start/end time, duration) are incomplete.",
      ar: "بيانات جدول العمل (الأيام، وقت البدء، وقت الانتهاء، المدة) غير مكتملة."
    },
    invalidLocation: {
      en: "Geospatial location coordinates, city, and governorate are required.",
      ar: "إحداثيات الموقع الجغرافي والمدينة والمحافظة مطلوبة."
    },
    successCreated: {
      en: "Job post created successfully.",
      ar: "تم إنشاء طلب الوظيفة بنجاح."
    },
    coordinatesRequired: {
      en: "Companion coordinates are required for distance calculation.",
      ar: "إحداثيات المرافق الحالية مطلوبة لحساب الأقرب."
    },
    notFound: {
      en: "Job post not found.",
      ar: "هذا الطلب غير موجود."
    },
    successDeleted: {
      en: "Request deleted successfully.",
      ar: "تم حذف الطلب بنجاح."
    }
  },
  proposal: {
    missingFields: {
      en: "All proposal fields (jobPostId, proposedRate, coverLetter) are required.",
      ar: "جميع حقول العرض مطلوبة."
    },
    jobNotFound: {
      en: "This job post does not exist.",
      ar: "هذا الطلب غير موجود."
    },
    jobNotOpen: {
      en: "Sorry, this job post is no longer accepting proposals.",
      ar: "عذراً، هذا الطلب لم يعد يستقبل عروضاً."
    },
    proposalConflict: {
      en: "Sorry, you cannot apply to this job due to scheduling conflicts with your active bookings.",
      ar: "عذراً، لا يمكنك التقديم على هذا الطلب لوجود تعارض مع مواعيد حجوزاتك المؤكدة الحالية."
    },
    successSubmitted: {
      en: "Proposal submitted successfully.",
      ar: "تم تقديم عرضك بنجاح لعدم وجود أي تعارض في مواعيدك!"
    },
    duplicateProposal: {
      en: "You have already submitted a proposal for this job post.",
      ar: "لقد قمت بتقديم عرض على هذا الطلب بالفعل سابقاً."
    },
    unauthorizedProposalView: {
      en: "Access denied. You are not authorized to view proposals for this job post.",
      ar: "غير مسموح لك بالاطلاع على عروض هذا الطلب."
    },
    invalidAction: {
      en: "Invalid proposal action. Must be 'accepted' or 'rejected'.",
      ar: "الحالة المرسلة غير صالحة. يجب أن تكون مقبول أو مرفوض."
    },
    proposalProcessed: {
      en: "This proposal has already been processed.",
      ar: "تمت معالجة هذا العرض مسبقاً."
    },
    proposalRejected: {
      en: "Proposal rejected successfully.",
      ar: "تم رفض العرض بنجاح."
    },
    proposalAccepted: {
      en: "Proposal accepted successfully and converted to a formal booking.",
      ar: "تم قبول العرض بنجاح وتحويله لحجز رسمي."
    }
  },
  review: {
    requiredFields: {
      en: "bookingId and rating are required.",
      ar: "حقل الحجز والتقييم مطلوبان."
    },
    invalidRating: {
      en: "Rating must be an integer between 1 and 5.",
      ar: "التقييم يجب أن يكون رقماً صحيحاً بين 1 و 5."
    },
    bookingNotFound: {
      en: "Booking not found.",
      ar: "الحجز غير موجود."
    },
    unauthorizedReview: {
      en: "Access denied. You can only review your own bookings.",
      ar: "تم رفض الوصول. يمكنك فقط تقييم الحجوزات الخاصة بك."
    },
    bookingNotCompleted: {
      en: "You can only review completed bookings.",
      ar: "يمكنك فقط تقييم الحجوزات المكتملة."
    },
    companionNotFound: {
      en: "Companion profile not found for this booking.",
      ar: "لم يتم العثور على ملف تعريف المرافق الخاص بهذا الحجز."
    },
    successCreated: {
      en: "Review created successfully.",
      ar: "تم إضافة تقييمك بنجاح."
    },
    duplicateReview: {
      en: "A review already exists for this booking.",
      ar: "لقد قمت بإضافة تقييم لهذا الحجز بالفعل سابقاً."
    },
    successDeleted: {
      en: "Review deleted successfully.",
      ar: "تم حذف التقييم بنجاح."
    }
  },
  payment: {
    successPaid: {
      en: "Payment processed successfully. Booking is now confirmed.",
      ar: "تمت عملية الدفع بنجاح. تم تأكيد الحجز الآن."
    },
    alreadyPaid: {
      en: "This booking is already paid.",
      ar: "هذا الحجز مدفوع بالفعل."
    },
    invalidPaymentMethod: {
      en: "Invalid payment method. Choose 'card', 'wallet', or 'cash'.",
      ar: "طريقة دفع غير صالحة. اختر بطاقة أو محفظة أو نقدي."
    },
    bookingNotApproved: {
      en: "Booking must be approved by companion before making a payment.",
      ar: "يجب أن يتم قبول الحجز من المرافق أولاً قبل الدفع."
    },
    paymentDetailsRetrieved: {
      en: "Payment transaction details retrieved successfully.",
      ar: "تم جلب تفاصيل المعاملة المالية بنجاح."
    },
    paymentNotFound: {
      en: "Payment record not found for this booking.",
      ar: "لم يتم العثور على سجل دفع لهذا الحجز."
    },
    paymentNotSettled: {
      en: "Payment not settled yet. Cannot release payout.",
      ar: "الدفع لم يتم تسويته بعد. لا يمكن صرف المبلغ."
    },
    alreadyReleased: {
      en: "Payout already released for this payment.",
      ar: "تم صرف المبلغ بالفعل لهذا الدفع."
    },
    payoutReleased: {
      en: "Payout released to companion successfully.",
      ar: "تم صرف المبلغ للمرافق بنجاح."
    },
    bookingNotInPaymentState: {
      en: "Booking is not in payment state. Must be pending_payment.",
      ar: "الحجز ليس في حالة الدفع. يجب أن يكون في حالة انتظار الدفع."
    },
    paymentInitiated: {
      en: "Payment initiated. Please complete payment at the gateway.",
      ar: "تم بدء عملية الدفع. يرجى إكمال الدفع على بوابة الدفع."
    },
    paymentConfirmed: {
      en: "Payment confirmed successfully. Booking is now active.",
      ar: "تم تأكيد الدفع بنجاح. الحجز الآن نشط."
    },
    paymentFailed: {
      en: "Payment failed. Please try again.",
      ar: "فشل الدفع. يرجى المحاولة مجددا."
    },
    invalidWebhook: {
      en: "Invalid webhook data.",
      ar: "بيانات webhook غير صحيحة."
    },
    refundNotEligible: {
      en: "This booking is not eligible for refund.",
      ar: "هذا الحجز غير مؤهل للاسترجاع."
    },
    refundTooLate: {
      en: "Refund window has closed. Service has already started.",
      ar: "انتهت فترة الاسترجاع. بدأت الخدمة بالفعل."
    },
    refundSuccess: {
      en: "Refund processed successfully.",
      ar: "تم معالجة الاسترجاع بنجاح."
    }
  },
  admin: {
    banSelf: {
      en: "You cannot ban or toggle your own account status.",
      ar: "لا يمكنك حظر أو إلغاء حظر حسابك الخاص."
    },
    banSuccess: {
      en: "User account status has been toggled successfully.",
      ar: "تم تغيير حالة حساب المستخدم بنجاح."
    },
    verifyCompanionSuccess: {
      en: "Companion profile status updated successfully.",
      ar: "تم تحديث حالة ملف المرافق بنجاح."
    },
    invalidVerifyStatus: {
      en: "Invalid status. Please provide either 'verified' or 'rejected'.",
      ar: "الحالة غير صالحة. الرجاء إدخال مقبول (verified) أو مرفوض (rejected)."
    }
  }
};

module.exports = messages;
