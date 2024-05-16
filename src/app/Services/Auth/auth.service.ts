import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { Router } from '@angular/router';
import { jwtDecode } from "jwt-decode";
import { MatSnackBar } from '@angular/material/snack-bar';

import { CustomJwtPayload } from 'src/app/Model/CustomJwtPayload ';
import { ITeacherAuth } from 'src/app/Model/iteacherAuth';
import { IUserUpdateFormData } from 'src/app/Model/iuserUpdateForm';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // baseUrl: string = process.env['API_KEY'];
  baseUrl: string = environment.API_KEY;

  tokenKey: string = 'auth_token';
  teacherId: any = '';
  currentUserId: string = 'UserId';
  currentUserRole: string = 'UserRole';
  IsLogin: any = new BehaviorSubject(null);
  IsUser!: boolean;

  constructor(private httpClient: HttpClient, private router: Router, private snackBar: MatSnackBar) {
    if (localStorage.getItem(this.tokenKey) !== null || localStorage.getItem(this.tokenKey) !== "") {
      this.saveCurrentUserId()
    }
  }

  signUp(data: IUserUpdateFormData): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/api/Student/register/student`, data).pipe(
      map(response => {
        // If the response indicates success, return the response data
        return response;
      }),
      catchError(error => {
        console.error('Error during sign up:', error);
        this.snackBar.open(`${error.error.Email[0]}`, 'Close', {
          duration: 2000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
        });

        // Return an observable that emits the error
        return throwError(error);
      })
    );
  }

  login(data: any): Observable<any> {

    return this.httpClient.post(`${this.baseUrl}/api/Auth/login`, data).pipe(
      tap((response: any) => {
        if (response && response.token) {
          // Save token

          localStorage.setItem(this.tokenKey, response.token);
          this.saveCurrentUserId()

          this.snackBar.open('تم تسجيل الدخول بنجاح ', 'Close', {
            duration: 2000,
            verticalPosition: 'bottom',
            horizontalPosition: 'right',
            panelClass: 'snackbar-success'
          });

          this.router.navigate(['/home']);
          // if (localStorage.getItem(this.currentUserRole) == "Teacher") {
          //   if (response.message == "pending" || response.message == ("Rejected")) {

          //     this.router.navigate([`/teacher/pending/${this.getUserId()}`]);

          //   } else {
          //     this.router.navigate([`/teacher/profile/${this.getUserId()}`]);
          //   }
          // }
          // else if (localStorage.getItem(this.currentUserRole) == "Student") {
          //   this.router.navigate(['/home']);
          // }
          // else if (localStorage.getItem(this.currentUserRole) == "Admin") {
          //   this.router.navigate(['/admindash']);
          // }
        }
      }),
      catchError(error => {

        this.snackBar.open(`خطأ في عنوان البريد او كلمة السر`, 'Close', {
          duration: 2000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['custom-snackbar'],
        });

        // Return an observable that emits the error
        return throwError(error);
      })
    );
  }

  signUpTeacher(data: ITeacherAuth): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/api/Teacher/register/teacher`, data).pipe(
      map((response: any) => {
        console.log(response);
        return response;
      }),
      catchError(error => {
        console.error('Error during sign up:', error);
        this.snackBar.open(`${error.error.Email[0]}`, 'Close', {
          duration: 2000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
        });
        return throwError(error);
      })
    );
  }

  getStudentData(id: any): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/api/Student/GetStudentById/${id}`)
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  removeUserRole(): void {
    localStorage.removeItem(this.currentUserRole);
  }

  removeUserId(): void {
    localStorage.removeItem(this.currentUserId);
  }

  getUserId(): any {
    return localStorage.getItem(this.currentUserId);
  }

  getUserRole(): any {
    return localStorage.getItem(this.currentUserRole);
  }

  //have id of user
  currentUser: any = new BehaviorSubject(null);

  saveCurrentUserId(): any {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {

      const decodedUser: CustomJwtPayload = jwtDecode(token);
      localStorage.setItem(this.currentUserId, decodedUser.nameid);
      localStorage.setItem(this.currentUserRole, decodedUser.role);

      console.log(`${localStorage.getItem(this.currentUserRole)} and ${localStorage.getItem(this.currentUserId)}`);
      this.IsLogin.next(decodedUser);
      return decodedUser.nameid;
    } else {
      console.log('No token found.');
    }
  }

  changePassword(userId: string, passwords: any): Observable<any> {
    return this.httpClient.post<any>(`${this.baseUrl}/api/Auth/change-password/${userId}`, passwords);
  }

  logOut(): Observable<void> {
    return this.httpClient.post<void>(`${this.baseUrl}/api/Auth/logout`, null);
  }

  editStudent(id: string, student: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/api/Student/Student/${id}`, student);
  }
}
