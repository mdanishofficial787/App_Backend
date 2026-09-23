import 'dart:convert';
import 'package:cross_file/cross_file.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import '../api_config.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}

/// Builds an http.MultipartFile from an XFile using raw bytes.
/// This works on EVERY platform (web, Android, iOS, desktop) — unlike
/// http.MultipartFile.fromPath, which fails on web because XFile.path
/// is a blob: URL there, not a real filesystem path.
Future<http.MultipartFile> _multipartFromXFile(
  String field,
  XFile file, {
  required String fallbackName,
}) async {
  final bytes = await file.readAsBytes();

  // Figure out a real filename with a proper image extension so
  // multer's fileFilter (which checks the extension AND mimetype)
  // accepts it.
  String name = file.name.isNotEmpty ? file.name : fallbackName;
  final lower = name.toLowerCase();
  if (!lower.endsWith('.jpg') &&
      !lower.endsWith('.jpeg') &&
      !lower.endsWith('.png')) {
    name = '$fallbackName.jpg';
  }

  final ext = name.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';

  return http.MultipartFile.fromBytes(
    field,
    bytes,
    filename: name,
    contentType: MediaType('image', ext),
  );
}

class DriverApiService {
  /// STEP 1: Register the driver. Returns the JWT token on success.
  /// Throws ApiException with the backend's message on failure
  /// (e.g. missing field, duplicate phone/email, etc).
  static Future<String> registerDriver({
    required String name,
    required String countryCode,
    required String phoneNumber,
    required String email,
    required String password,
    required String cnicNumber,
    required String license,
    required String licenseExpiryDate, // ISO format e.g. 2028-05-01
    required XFile driverPhoto,
    required XFile cnicFront,
    required XFile cnicBack,
    required XFile licenseFront,
    required XFile licenseBack,
    String countryIso = 'PK',
  }) async {
    final uri = Uri.parse(kDriverRegisterEndpoint);
    final request = http.MultipartRequest('POST', uri);

    request.fields.addAll({
      'Name': name,
      'CountryCode': countryCode,
      'PhoneNumber': phoneNumber,
      'Email': email,
      'Password': password,
      'ConfirmPassword': password,
      'CnicNumber': cnicNumber,
      'License': license,
      'LicenseExpiryDate': licenseExpiryDate,
      'CountryIso': countryIso,
      'backgroundCheckConsent': 'true',
    });

    request.files.add(
      await _multipartFromXFile(
        'driverPhoto',
        driverPhoto,
        fallbackName: 'driverPhoto.jpg',
      ),
    );
    request.files.add(
      await _multipartFromXFile(
        'CnicFront',
        cnicFront,
        fallbackName: 'cnicFront.jpg',
      ),
    );
    request.files.add(
      await _multipartFromXFile(
        'CnicBack',
        cnicBack,
        fallbackName: 'cnicBack.jpg',
      ),
    );
    request.files.add(
      await _multipartFromXFile(
        'LicenseFront',
        licenseFront,
        fallbackName: 'licenseFront.jpg',
      ),
    );
    request.files.add(
      await _multipartFromXFile(
        'LicenseBack',
        licenseBack,
        fallbackName: 'licenseBack.jpg',
      ),
    );

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    final body = jsonDecode(response.body);

    if (response.statusCode == 201 && body['success'] == true) {
      return body['token'] as String;
    }
    throw ApiException(body['message'] ?? 'Driver registration failed');
  }

  /// STEP 2: Register the vehicle. Requires the token from step 1.
  static Future<void> registerVehicle({
    required String token,
    required String vehicleMake,
    required String vehicleModel,
    required String variant,
    required String numberOfSeats,
    required String registrationNumber,
    required String vehicleColor,
    required XFile registrationBook,
    required XFile frontView,
  }) async {
    final uri = Uri.parse(kVehicleRegisterEndpoint);
    final request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $token';

    request.fields.addAll({
      'vehicleMake': vehicleMake,
      'vehicleModel': vehicleModel,
      'variant': variant,
      'numberOfSeats': numberOfSeats,
      'registrationNumber': registrationNumber,
      'vehicleColor': vehicleColor,
    });

    request.files.add(
      await _multipartFromXFile(
        'registrationBook',
        registrationBook,
        fallbackName: 'registrationBook.jpg',
      ),
    );
    request.files.add(
      await _multipartFromXFile(
        'frontView',
        frontView,
        fallbackName: 'frontView.jpg',
      ),
    );

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    final body = jsonDecode(response.body);

    if (response.statusCode == 201 && body['success'] == true) {
      return;
    }
    throw ApiException(body['message'] ?? 'Vehicle registration failed');
  }

  /// STEP 3: Login the driver. Returns the full JSON response on success.
  /// Throws ApiException on failure (e.g. invalid credentials).
  static Future<Map<String, dynamic>> loginDriver({
    required String countryCode,
    required String phoneNumber,
    required String password,
  }) async {
    final uri = Uri.parse(kDriverLoginEndpoint);

    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'CountryCode': countryCode,
        'PhoneNumber': phoneNumber,
        'Password': password,
      }),
    );

    final body = jsonDecode(response.body);

    if (response.statusCode == 200 && body['success'] == true) {
      return body;
    }

    throw ApiException(body['message'] ?? 'Login failed');
  }

  /// STEP 4: Save preferred routes to backend.
  static Future<void> savePreferredRoutes({
    required String driverId, // You might need this depending on your backend
    required String startPoint,
    String? endPoint,
    String? time,
  }) async {
    final uri = Uri.parse(kSavePreferredRoutesEndpoint);

    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'driverId': driverId,
        'startPoint': startPoint,
        if (endPoint != null && endPoint.isNotEmpty) 'endPoint': endPoint,
        if (time != null && time.isNotEmpty) 'time': time,
      }),
    );

    if (response.statusCode == 404) {
      throw ApiException(
        'Endpoint not found. Please tell your React developer to create POST /driver/preferred-routes',
      );
    }

    try {
      final body = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return;
      }

      throw ApiException(body['message'] ?? 'Failed to save preferences');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        'Server returned an invalid response (Status ${response.statusCode})',
      );
    }
  }
}
