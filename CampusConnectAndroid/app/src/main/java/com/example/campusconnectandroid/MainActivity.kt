package com.example.campusconnectandroid

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import androidx.compose.runtime.rememberCoroutineScope

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            CampusConnectApp()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CampusConnectApp() {

    var students by remember {
        mutableStateOf<List<Student>>(emptyList())
    }

    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var course by remember { mutableStateOf("") }
    var semester by remember { mutableStateOf("") }

    var isLoading by remember {
        mutableStateOf(true)
    }

    val context = LocalContext.current

    val scope = rememberCoroutineScope()


    suspend fun loadStudents() {
        try {
            val response = withContext(Dispatchers.IO) {
                RetrofitClient.api.getStudents()
            }

            if (response.isSuccessful) {
                students = response.body() ?: emptyList()
            }
        } catch (e: Exception) {
            // Error handled with Toast when needed
        }

        isLoading = false
    }

    LaunchedEffect(Unit) {
        loadStudents()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text("CampusConnect Students")
                }
            )
        }
    ) { paddingValues ->

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(bottom = 20.dp)
        ) {

            item {
                Text(
                    text = "Add Student",
                    fontSize = 22.sp
                )
            }

            item {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name") },
                    modifier = Modifier.fillMaxWidth()
                )
            }

            item {
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    modifier = Modifier.fillMaxWidth()
                )
            }

            item {
                OutlinedTextField(
                    value = course,
                    onValueChange = { course = it },
                    label = { Text("Course") },
                    modifier = Modifier.fillMaxWidth()
                )
            }

            item {
                OutlinedTextField(
                    value = semester,
                    onValueChange = { semester = it },
                    label = { Text("Semester") },
                    modifier = Modifier.fillMaxWidth()
                )
            }

            item {
                Button(
                    onClick = {
                        if (
                            name.isBlank() ||
                            email.isBlank() ||
                            course.isBlank() ||
                            semester.isBlank()
                        ) {
                            return@Button
                        }

                        val semesterNumber = semester.toIntOrNull()

                        if (semesterNumber == null || semesterNumber < 1) {
                            return@Button
                        }

                        val newStudent = Student(
                            name = name,
                            email = email,
                            course = course,
                            semester = semesterNumber
                        )

                        scope.launch {
                            try {
                                val response = withContext(Dispatchers.IO) {
                                    RetrofitClient.api.addStudent(newStudent)
                                }

                                if (response.isSuccessful) {
                                    val addedStudent = response.body()

                                    if (addedStudent != null) {
                                        students = students + addedStudent
                                    }

                                    name = ""
                                    email = ""
                                    course = ""
                                    semester = ""

                                    Toast.makeText(
                                        context,
                                        "Student added successfully",
                                        Toast.LENGTH_SHORT
                                    ).show()

                                } else if (response.code() == 400) {

                                    Toast.makeText(
                                        context,
                                        "Invalid student data",
                                        Toast.LENGTH_SHORT
                                    ).show()

                                } else if (response.code() == 404) {

                                    Toast.makeText(
                                        context,
                                        "Student not found",
                                        Toast.LENGTH_SHORT
                                    ).show()

                                } else {

                                    Toast.makeText(
                                        context,
                                        "Failed to add student",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                }

                            } catch (e: Exception) {
                                Toast.makeText(
                                    context,
                                    e.message ?: "Failed to load students",
                                    Toast.LENGTH_LONG
                                ).show()
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Add Student")
                }
            }

            item {
                Text(
                    text = "Students",
                    fontSize = 22.sp,
                    modifier = Modifier.padding(top = 10.dp)
                )
            }

            if (isLoading) {
                item {
                    Text("Loading students...")
                }
            }

            items(students) { student ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = CardDefaults.cardElevation(
                        defaultElevation = 4.dp
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = student.name,
                            fontSize = 20.sp
                        )

                        Text("Email: ${student.email}")
                        Text("Course: ${student.course}")
                        Text("Semester: ${student.semester}")
                    }
                }
            }
        }
    }
}