import 'package:flutter/foundation.dart';

// --- ACTIVE TARGET BACKEND IP ---
// Active Wi-Fi IP is 192.168.88.59. On browser/web, localhost:3000 connects directly.
const String _kHost = kIsWeb ? 'http://localhost:3000' : 'http://192.168.88.59:3000';

const String kBaseUrl = _kHost;
const String kDispatchBaseUrl = _kHost;

const String kSendOtpEndpoint = '$kBaseUrl/api/auth/forgot-password/send-otp';
const String kVerifyOtpEndpoint =
    '$kBaseUrl/api/auth/forgot-password/verify-otp';
const String kResetPasswordEndpoint =
    '$kBaseUrl/api/auth/forgot-password/reset-password';

// Driver Endpoints
const String kDriverRegisterEndpoint = '$kBaseUrl/driver/register';
const String kDriverLoginEndpoint = '$kBaseUrl/driver/login';
const String kVehicleRegisterEndpoint = '$kBaseUrl/vehicle/register';
const String kSavePreferredRoutesEndpoint =
    '$kBaseUrl/driver/preferred-routes'; 
const String kSaveAvailabilityEndpoint = '$kBaseUrl/driver/availability';
const String kReportIssueEndpoint = '$kBaseUrl/driver/report-issue';
