const express = require('express');
const app = express();
const path = require('path');
const db = require('./db');
const bodyParser = require('body-parser');
const ort = require('onnxruntime-web');


const PORT = process.env.PORT || 3001;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});
app.post('/login', async (req, res) => {
  const { userID, password } = req.body;

  try {
    const [results] = await db.execute('SELECT * FROM Employee WHERE EmpID = ? AND Password = ?', [userID, password]);

    if (results.length === 0) {
      return res.status(401).send('Unauthorized'); // User not found or invalid credentials
    }

    const user = results[0];
    let redirectUrl;

    if (user.Administration === 1) {
      redirectUrl = '/adminHome.html';
    } else if (user.Job === 'radiologist') {
      redirectUrl = '/radiologistHome.html';
    } else {
      redirectUrl = '/staffHome.html';
    }

    res.redirect(redirectUrl); // Redirect the user to the appropriate interface
  } catch (error) {
    console.error('Error checking credentials:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


//display patient data
app.get('/data', async (req, res) => {
  const { offset, limit } = req.query;

  console.log('Offset:', offset);
  console.log('Limit:', limit);

  try {
    const [results] = await db.execute(`SELECT PatientID, FirstName, LastName, Gender, MedicalHistory, ImageProcessingHistory, responsibleEmpId FROM Patients LIMIT ${parseInt(offset)}, ${parseInt(limit)}`);
    res.json(results);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//searching in patient table
app.get('/data', async (req, res) => {
  const { offset, limit, search } = req.query;

  console.log('Offset:', offset);
  console.log('Limit:', limit);
  console.log('Search:', search);

  let query = 'SELECT PatientID, FirstName, LastName, Gender, MedicalHistory, ImageProcessingHistory, responsibleEmpId FROM Patients';
  let params = [];

  if (search) {
    query += ' WHERE PatientID LIKE ? OR MedicalHistory LIKE ? OR ImageProcessingHistory LIKE ? OR  FirstName LIKE ? OR LastName LIKE ? OR Gender LIKE ?  OR responsibleEmpId LIKE ?';
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }

  query += ` LIMIT ${parseInt(offset)}, ${parseInt(limit)}`;

  try {
    const [results] = await db.execute(query, params);
    res.json(results);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//dispaly employees data
app.get('/data-emp', async (req, res) => {
  const { offset, limit } = req.query;

  console.log('Offset:', offset);
  console.log('Limit:', limit);

  try {
    const [results] = await db.execute(`SELECT EmpID, FirstName, LastName, Job, Administration, Access, supervisorId FROM Employee LIMIT ${parseInt(offset)}, ${parseInt(limit)}`);
    res.json(results);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//search the employee table
app.get('/emp-data', async (req, res) => {
  const { offset, limit, search } = req.query;

  console.log('Offset:', offset);
  console.log('Limit:', limit);
  console.log('Search:', search);

  let query = 'SELECT EmpID, FirstName, LastName, Job, Administration, Access, supervisorId FROM Employee';
  let params = [];

  if (search) {
    query += ' WHERE EmpID LIKE ? OR FirstName LIKE ? OR LastName LIKE ? OR  Job LIKE ? OR Administration LIKE ? OR Access LIKE ?  OR supervisorId LIKE ?';
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }

  query += ` LIMIT ${parseInt(offset)}, ${parseInt(limit)}`;

  try {
    const [results] = await db.execute(query, params);
    res.json(results);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Handle password change request
app.post('/change-password', async (req, res) => {
  const { userID, currentPassword, newPassword } = req.body;

  try {
    // Check if userID and currentPassword match
    const [results] = await db.execute('SELECT * FROM Employee WHERE EmpID = ? AND Password = ?', [userID, currentPassword]);

    if (results.length === 0) {
      return res.status(401).send('Unauthorized'); // User not found or invalid credentials
    }

    // Update the password in the database
    await db.execute('UPDATE Employee SET Password = ? WHERE EmpID = ?', [newPassword, userID]);

    res.redirect('/password-changed.html');
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).send('Internal Server Error');
  }
});
// Handle password check request
app.post('/check-password', async (req, res) => {
  const { userID, currentPassword } = req.body;

  try {
    // Check if userID and currentPassword match
    const [results] = await db.execute('SELECT * FROM Employee WHERE EmpID = ? AND Password = ?', [userID, currentPassword]);

    if (results.length === 0) {
      return res.json({ success: false }); // User not found or invalid credentials
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error checking password:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
