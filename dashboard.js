// Function to update date and time
function updateDateTime() {
    const now = new Date();
    const dateTimeString = now.toLocaleString();
    document.getElementById('currentDateTime').textContent = `Current Date & Time: ${dateTimeString}`;
}
setInterval(updateDateTime, 1000);

window.onload = updateDateTime;

document.getElementById("goToAttendance").addEventListener("click", () => {
    window.location.href = "templates/take_attendance.html";
});

document.addEventListener("DOMContentLoaded", function () {
    let facultyName = localStorage.getItem("facultyName");
    let facultyPic = localStorage.getItem("facultyPic");

    const nameElement = document.getElementById("facultyName");
    const picElement = document.getElementById("facultyPic");



    if (!nameElement || !picElement) {
        console.error("Dashboard elements not found.");
        return;
    }

    function getGreeting() {
        const hour = new Date().getHours();
        return hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
    }

    // If faculty data is missing, fetch from the backend
    if (!facultyName || !facultyPic) {
        fetch("http://localhost:5000/getFacultyData", { credentials: "include" })
    .then(response => response.json())
    .then(data => {
        console.log("Received facultyPic URL:", data.profilePic); // ✅ Debugging

        if (data.success) {
            facultyName = data.name;
            facultyPic = data.profilePic;

            localStorage.setItem("facultyName", facultyName);
            localStorage.setItem("facultyPic", facultyPic);

            nameElement.innerText = `${getGreeting()}, ${facultyName}!`;
            picElement.src = facultyPic || "default-profile.png";
        }
    })
    .catch(error => console.error("Error fetching faculty data:", error));

    } else {
        // Use localStorage data if available
        nameElement.innerText = `${getGreeting()}, ${facultyName}!`;
        picElement.src = facultyPic || "default-profile.png";
    }
});
