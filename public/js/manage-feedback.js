import { database, ref, get } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', async function() {
  const feedbackTableBody = document.getElementById("feedbackTableBody");
  const feedbackChart = document.getElementById("feedbackChart");
  const averageRatingDisplay = document.getElementById("averageRatingDisplay");

  if (!feedbackTableBody || !feedbackChart) {
    console.error("Feedback table body or chart not found in HTML.");
    return;
  }

  try {
    const feedbackSnapshot = await get(ref(database, 'feedback'));
    if (feedbackSnapshot.exists()) {
      const feedbacks = feedbackSnapshot.val();
      const ratings = [];

      for (const bookingId in feedbacks) {
        const feedback = feedbacks[bookingId];
        const userSnapshot = await get(ref(database, `users/${feedback.userId}`));
        const user = userSnapshot.val();
        const userName = user ? `${user.firstName} ${user.lastName}` : "Unknown";

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${userName}</td>
          <td>${feedback.rating}</td>
          <td>${feedback.comments}</td>
        `;
        feedbackTableBody.appendChild(row);

        ratings.push(parseInt(feedback.rating));
      }

      const totalRatings = ratings.length;
      const sumRatings = ratings.reduce((sum, rating) => sum + rating, 0);
      const averageRating = (sumRatings / totalRatings).toFixed(2);

      averageRatingDisplay.textContent = `Media generală a ratingurilor: ${averageRating}`;

      const ctx = feedbackChart.getContext('2d');
      const chartData = {
        labels: ['Media Ratingurilor'],
        datasets: [{
          label: 'Media generală',
          data: [averageRating],
          backgroundColor: [
            'rgba(75, 192, 192, 0.2)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1
        }]
      };

      const chartOptions = {
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            ticks: {
              stepSize: 1
            }
          }
        },
        maintainAspectRatio: false,
        responsive: true
      };

      feedbackChart.parentNode.style.height = "400px"; 

      new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: chartOptions
      });

    } else {
      console.log("No feedback found");
    }
  } catch (error) {
    console.error("Failed to retrieve feedback:", error);
  }
});
