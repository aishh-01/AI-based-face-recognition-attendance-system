

// Faculty Login Modal
const facultyLoginBtn = document.getElementById('facultyLoginBtn');
const facultyLoginModal = document.getElementById('facultyLoginModal');
const closeModal = document.getElementById('closeModal');

// Show the modal when the button is clicked
facultyLoginBtn.addEventListener('click', () => {
facultyLoginModal.style.display = 'flex';
});

// Close the modal
closeModal.addEventListener('click', () => {
facultyLoginModal.style.display = 'none';
});

// Close the modal when clicking outside of it
window.addEventListener('click', (event) => {
if (event.target === facultyLoginModal) {
facultyLoginModal.style.display = 'none';
}
});

document.getElementById("facultyLoginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const facultyId = document.getElementById("facultyUsername").value; 
    const password = document.getElementById("facultyPassword").value; 

    console.log("Sending request with:", { facultyId, password }); // Debugging

    try {
        const response = await fetch("http://localhost:5000/facultyLogin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ facultyId, password }), // ✅ Fixed variable names
            credentials: "include"  // ✅ Required for CORS authentication
        });

        const data = await response.json(); // ✅ Corrected await usage

        if (data.success) {
            // Store faculty data in localStorage
            localStorage.setItem("facultyName", data.name);
            localStorage.setItem("facultyPic", data.profilePic);

            // Redirect to dashboard
            window.location.href = "dashboard.html";
        } else {
            alert("Invalid credentials");
        }
    } catch (error) {
        console.error("Error during login:", error);
    }
});
 //STUDENT LOGIN_MODAL

        const studentLoginBtn = document.getElementById('studentLoginBtn');
        const studentLoginModal = document.getElementById('studentLoginModal');
        const studentcloseModal = document.getElementById('studentcloseModal');

        // Show the modal when the button is clicked
        studentLoginBtn.addEventListener('click', () => {
            studentLoginModal.style.display = 'flex';
        });

        // Close the modal
        studentcloseModal.addEventListener('click', () => {
            studentLoginModal.style.display = 'none';
        });

        // Close the modal when clicking outside of it
        window.addEventListener('click', (event) => {
            if (event.target === studentLoginModal) {
                studentLoginModal.style.display = 'none';
            }
        });

        // Handle form submission
        const StudentLoginForm = document.getElementById('StudentLoginForm');
        StudentLoginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const stu_username = document.getElementById('studentUsername').value.trim();

    // Student ID Validation
    const stuIdPattern = /^BTBTI\d{5}$/;
    if (!stuIdPattern.test(stu_username)) {
        alert("Invalid Student ID! It must start with 'BTBTI' followed by 5 digits");
        return;
    }

            if (stu_username === "BTBTI22047") {
                // Redirect to specific page for this student ID
                window.location.href = "2216903.html";
            }
            else if(stu_username === "BTBTI22036") {
                // Redirect to specific page for this student ID
                window.location.href = "2216867.html";
            }
            else if(stu_username === "BTBTI22152") {
                // Redirect to specific page for this student ID
                window.location.href = "2216794.html";
            }
            else if(stu_username === "BTBTI22033") {
                // Redirect to specific page for this student ID
                window.location.href = "2216825.html";
            }
            else {
                // Redirect to the general student dashboard
                window.location.href = "dashStudent.html";
            }
        });


        //ADMIN LOGIN_MODAL

        const adminLoginBtn = document.getElementById('adminLoginBtn');
        const adminLoginModal = document.getElementById('adminLoginModal');
        const admincloseModal = document.getElementById('admincloseModal');

        // Show the modal when the button is clicked
        adminLoginBtn.addEventListener('click', () => {
            adminLoginModal.style.display = 'flex';
        });

        // Close the modal
        admincloseModal.addEventListener('click', () => {
            adminLoginModal.style.display = 'none';
        });

        // Close the modal when clicking outside of it
        window.addEventListener('click', (event) => {
            if (event.target === adminLoginModal) {
                adminLoginModal.style.display = 'none';
            }
        });

        // Handle form submission
        const adminLoginForm = document.getElementById('adminLoginForm');
        adminLoginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = document.getElementById('adminUsername').value;
            const pass = document.getElementById('adminPassword').value;

            const adminIdPattern = /^ADAD\d{5}$/;
            if (!adminIdPattern.test(username)) {
                alert("Invalid Admin ID! It must start with 'ADAD' followed by 5 digits");
                return;
            }
        
            // Password Validation
            const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
            if (!passwordPattern.test(pass)) {
                alert("Password must be at least 6 characters long and contain letters and numbers.");
                return;
            }

            // Redirect to the dashboard
            window.location.href = "admin_dashboard.html";
        });