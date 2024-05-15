import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CountsService {
  // URL = process.env['API_KEY'];
  URL = environment.API_KEY;

  constructor(private httpClient: HttpClient) { }

  getCountStudentsPerCourse(courseId: number): Observable<number> {
    return this.httpClient.get<number>(`${this.URL}/api/Courses/CountStudents?courseId=${courseId}`);
  }

  getCountLectures(courseId: number): Observable<number> {
    return this.httpClient.get<number>(`${this.URL}/api/Courses/CountLectures?courseId=${courseId}`);
  }

  getCountAllTeachers(): Observable<any> {
    return this.httpClient.get<any>(`${this.URL}/api/Home/GetTeachersCount`);
  }

  getCountAllStudents(): Observable<any> {
    return this.httpClient.get<any>(`${this.URL}/api/Home/GetStudentCount`);
  }

  getCountAllCourses(): Observable<any> {
    return this.httpClient.get<any>(`${this.URL}/api/Home/GetCoursesCount`);
  }

  getCountAllLectures(): Observable<any> {
    return this.httpClient.get<any>(`${this.URL}/api/Home/GetLecturesCount`);
  }
}
// api/Home/GetCoursesCount
