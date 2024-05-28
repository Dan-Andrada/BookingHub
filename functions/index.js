const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const nodemailer = require('nodemailer');

const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: 'uptbookinghub@gmail.com',  
    pass: 'ggmb gope jyhq bkgv'         
  },
  logger: true, 
  debug: true 
});

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

exports.sendBookingRequestEmail = functions.database.ref('/rezervari/{bookingId}')
  .onCreate((snapshot, context) => {
    const reservation = snapshot.val();

    return admin.database().ref(`/users/${reservation.userId}`).once('value').then(userSnapshot => {
      const userData = userSnapshot.val();

      const mailOptions = {
        from: '"UPT Booking Hub" <uptbookinghub@gmail.com>',
        to: 'maria.clipici@student.upt.ro',
        subject: 'Nouă Cerere de Rezervare',
        text: `Ai o nouă cerere de rezervare de la ${userData.firstName} ${userData.lastName} pentru evenimentul "${reservation.title}" în sala ${reservation.location}.`
      };

      return mailTransport.sendMail(mailOptions)
        .then(() => console.log('Email de notificare trimis cu succes!'))
        .catch((error) => console.error('Eroare la trimiterea emailului:', error));
    }).catch(error => {
      console.error('Eroare la citirea datelor utilizatorului:', error);
      throw new functions.https.HttpsError('internal', 'Eroare la procesarea cererii de rezervare.');
    });
  });



  exports.sendBookingApprovalEmail = functions.database.ref('/rezervari/{bookingId}')
  .onUpdate((change, context) => {
    const before = change.before.val();
    const after = change.after.val();

    if (before.status !== after.status && after.status === "acceptat") {
      return admin.database().ref(`/users/${after.userId}`).once('value').then(userSnapshot => {
        const userData = userSnapshot.val();

        const mailOptions = {
          from: '"UPT Booking Hub" <uptbookinghub@gmail.com>',
          to: userData.email,
          subject: 'Rezervarea ta a fost acceptată',
          text: `Bună ${userData.firstName} ${userData.lastName}, rezervarea ta pentru evenimentul "${after.title}" în sala ${after.location} a fost acceptată.`
        };

        return mailTransport.sendMail(mailOptions)
          .then(() => console.log('Email de confirmare trimis cu succes!'))
          .catch((error) => console.error('Eroare la trimiterea emailului de confirmare:', error));
      }).catch(error => {
        console.error('Eroare la citirea datelor utilizatorului:', error);
        throw new functions.https.HttpsError('internal', 'Eroare la procesarea cererii de rezervare.');
      });
    }
    return null;
  });
