const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const fs = require("fs");
const XLSX = require("xlsx");
const app = express();




// ✅ Session comes BEFORE CORS
app.use(session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // true in production with HTTPS
}));

// ✅ Then setup CORS
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
  }));
// 👇 Middleware order matters
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

app.use(express.static(path.join(__dirname, "templates")));

mongoose.connect("mongodb://127.0.0.1:27017/attendanceDB", { useNewUrlParser: true, useUnifiedTopology: true });

const FacultySchema = new mongoose.Schema({
    name: String,
    facultyID: String,
    email: String,
    password: String,
    photo: String,
    assignments: [
        {
            course: String,
            stream: String,
            year: Number,
            semester: Number,
            subjects: [String],
        }
    ],
});

const Faculty = mongoose.model("Faculty", FacultySchema);

const Student = mongoose.model("Student", new mongoose.Schema({
    name: String,
    studentID: String,
    course: String,
    stream: String,
    email: String,
    password: String,
    photo: String,
}));

app.post("/api/addFaculty", upload.single("photo"), async (req, res) => {
    try {
        const newFaculty = new Faculty({
            name: req.body.name,
            facultyID: req.body.facultyID,
            email: req.body.email,
            password: req.body.password,
            photo: req.file ? req.file.path.replace(/\\/g, "/") : "",
            courses: []
        });
        await newFaculty.save();
        res.json({ message: "Faculty added successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Error adding faculty" });
    }
});

app.put("/api/updateFacultyAssignments/:facultyID", async (req, res) => {
    try {
        const { facultyID } = req.params;
        const { assignments } = req.body;

        const faculty = await Faculty.findOne({ facultyID });
        if (!faculty) {
            return res.status(404).json({ error: "Faculty not found" });
        }

        faculty.assignments = assignments;
        await faculty.save();

        res.json({ message: "Faculty assignments updated successfully!" });
    } catch (error) {
        console.error("Error updating assignments:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.use("/uploads", express.static("uploads")); // ✅ This serves the image folder
app.post('/facultyLogin', async (req, res) => {
    const { facultyId, password } = req.body; // ✅ Ensure frontend & backend match

    console.log("Login Request for FacultyID:", facultyId);

    const faculty = await Faculty.findOne({ facultyID: facultyId }); // ✅ Matches database field

    if (!faculty) {
        console.log("Faculty not found in DB");
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (faculty.password === password) {
        req.session.faculty = {
            facultyID: faculty.facultyID,
            name: faculty.name,
            photo: faculty.photo
        };

        console.log("Session after login:", req.session);
        req.session.facultyId = facultyId;
        return res.json({
            success: true,
            message: "Login successful",
            name: faculty.name,
            profilePic: `http://localhost:5000/${faculty.photo.replace(/\\/g, "/")}`
        });
    } else {
        console.log("Incorrect Password");
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

app.post("/api/addStudent", upload.single("photo"), async (req, res) => {
    try {
        console.log("📥 Incoming student data:", req.body);
        console.log("🖼️ Uploaded file:", req.file);

        // Save student to MongoDB
        const newStudent = new Student({
            name: req.body.name,
            studentID: req.body.studentID,
            course: req.body.course,
            stream: req.body.stream,
            email: req.body.email,
            password: req.body.password,
            photo: req.file.path,
        });
        await newStudent.save();

        // Excel setup
        const folderPath = path.join(__dirname, "excels");
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }

        const fileName = req.body.stream
            ? `${req.body.course}_${req.body.stream}.xlsx`
            : `${req.body.course}.xlsx`;

        const filePath = path.join(folderPath, fileName);
        const sheetName = "Students";
        let data = [];

        let workbook;
        if (fs.existsSync(filePath)) {
            // 📂 Load existing workbook
            workbook = XLSX.readFile(filePath);
            if (workbook.SheetNames.includes(sheetName)) {
                const worksheet = workbook.Sheets[sheetName];
                data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
            }
        } else {
            // 🆕 Create new workbook
            workbook = XLSX.utils.book_new();
        }

        // ✅ Prevent duplicate entries by studentID
        const alreadyExists = data.some(row => row.StudentID?.toString().trim() === req.body.studentID.toString().trim());


        if (!alreadyExists) {
            data.push({
                StudentID: req.body.studentID,
                Name: req.body.name,
                
            });
        
            console.log("📊 Updated data for Excel:", data); // << DEBUG HERE
        
            const newSheet = XLSX.utils.json_to_sheet(data);
            workbook.Sheets[sheetName] = newSheet;

            if (!workbook.SheetNames.includes(sheetName)) {
                workbook.SheetNames.push(sheetName);
            }

            XLSX.writeFile(workbook, filePath);
            console.log(`✅ Excel updated/created at: ${filePath}`);
        } else {
            console.log("⚠️ Student already exists in Excel. Skipping Excel write.");
        }

        res.json({ message: "Student added and Excel updated!" });

    } catch (error) {
        console.error("❌ Error in /api/addStudent:", error);
        res.status(500).json({ error: "Error adding student" });
    }
});


app.use("/uploads", express.static("uploads"));

app.get("/api/faculty", async (req, res) => {
    const { course } = req.query;
    if (!course) return res.status(400).json({ error: "Course is required" });

    try {
        const faculty = await Faculty.find({ courses: { $regex: new RegExp(`^${course}$`, "i") } });
        res.json(faculty.map(facultyMember => ({
            name: facultyMember.name,
            email: facultyMember.email,
            facultyID: facultyMember.facultyID,
            subjects: facultyMember.subjects  
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/students", async (req, res) => {
    const { course } = req.query;
    if (!course) return res.status(400).json({ error: "Course is required" });

    try {
        const students = await Student.find({ course: { $regex: new RegExp(`^${course}$`, "i") } });
        res.json(students.map(student => ({
            name: student.name,
            email: student.email,
            stream: student.stream,
            studentID: student.studentID
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/sessionData', (req, res) => {
    console.log("Session data:", req.session);  // ✅ Debug Log
    res.json(req.session.faculty || { message: "No session found" });
});
app.get('/getFacultyData', (req, res) => {
    if (!req.session.faculty) {
        return res.status(401).json({ success: false, message: "Not logged in" });
    }

    res.json({
        success: true,
        name: req.session.faculty.name,
        profilePic: `http://localhost:5000/${req.session.faculty.photo.replace(/\\/g, "/")}`
    });
});


app.get("/getFacultyAssignments", async (req, res) => {
    if (!req.session.faculty) {
        return res.status(401).json({ status: "error", message: "Unauthorized access" });
    }

    try {
        const faculty = await Faculty.findOne({ facultyID: req.session.faculty.facultyID });

        if (!faculty) {
            return res.status(404).json({ status: "error", message: "Faculty not found" });
        }

        res.json({
            status: "success",
            assignments: faculty.assignments
        });
    } catch (error) {
        console.error("Error fetching assignments:", error);
        res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
});




let pythonProcess = null;
const { spawn } = require('child_process');

app.post('/start_attendance', (req, res) => {
    const { course, year, semester, subject, stream } = req.body;

    if (!course || !semester || !year || !subject) {
        return res.status(400).json({ message: "Missing data", status: "error" });
    }

    // Provide default stream if not needed
    const selectedStream = stream && stream !== "Not Needed" ? stream : "NotNeeded";

    // Argument order: course, stream, year, semester, subject
    const args = ['server/face_recog.py', course, selectedStream, year, semester, subject];

    // Spawn the Python script
    const pythonProcess = spawn('python', args);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python Output: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    res.json({ message: "Attendance started", status: "success" });
});




app.post('/stop_attendance', (req, res) => {
    if (pythonProcess) {
        pythonProcess.kill();
        pythonProcess = null;
        res.json({ message: "Attendance stopped", status: "success" });
    } else {
        res.json({ message: "No process running", status: "error" });
    }
});
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: "Logged out" });
});


app.listen(5000, () => console.log("Server running on port 5000"));
