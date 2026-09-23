// This is a basic Flutter widget test.

import 'package:flutter_test/flutter_test.dart';

import 'package:ride_and_serve/main.dart';

void main() {
  testWidgets('App renders welcome screen smoke test', (
    WidgetTester tester,
  ) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const RideAndServeApp());

    // Verify that our app renders the welcome screen.
    expect(find.text('Welcome!'), findsOneWidget);
  });
}
