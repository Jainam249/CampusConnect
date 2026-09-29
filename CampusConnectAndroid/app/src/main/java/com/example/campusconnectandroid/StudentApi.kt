package com.example.campusconnectandroid

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface StudentApi {

    @GET("students")
    suspend fun getStudents(): Response<List<Student>>

    @POST("students")
    suspend fun addStudent(
        @Body student: Student
    ): Response<Student>
}