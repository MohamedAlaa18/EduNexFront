import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
// import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TeachersService {

  URL = process.env['API_KEY'];

  constructor(private httpClient: HttpClient) { }

  getAllTeachers(): Observable<any> {
    return this.httpClient.get(`${this.URL}/teachers`);
  }

  getTeacherById(teacherId: string): Observable<any> {
    return this.httpClient.get(`${this.URL}/teacher/${teacherId}`);
  }
}
