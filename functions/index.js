const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.createUser = functions.https.onCall(async (data, context) => {

  if (!context.auth ) {
    throw new functions.https.HttpsError("unauthenticated", "Request not authenticated.");
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: data.password,
    });

    
    await admin.database().ref(`users/${userRecord.uid}`).set({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role,
      ...(data.roleSpecificInfo || {}),
    });

    return { uid: userRecord.uid };
  } catch (error) {
    console.error("Error creating new user:", error);
    throw new functions.https.HttpsError("internal", "Unable to create new user.");
  }
});