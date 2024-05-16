import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/Components/CourseDetails/Dialog/confirmation-dialog/confirmation-dialog.component';
import { AddEditCourseComponent } from '../add-edit-course/add-edit-course.component';
import { AuthService } from 'src/app/Services/Auth/auth.service';
import { ICourse } from 'src/app/Model/icourse';
import { CoursesService } from 'src/app/Services/Courses/courses.service';
import { Observable, forkJoin } from 'rxjs';
import { CountsService } from 'src/app/Services/Counts/counts.service';
import { PaymentService } from 'src/app/Services/Payment/payment.service';

@Component({
  selector: 'app-teacher-course',
  templateUrl: './teacher-course.component.html',
  styleUrls: ['./teacher-course.component.css']
})
export class TeacherCourseComponent implements OnInit {
  courses!: ICourse[];
  teacherID!: string
  balance!: number;

  displayedColumns: string[] = ['CourseName', 'Price', 'PurchaseTimes', 'Actions'];
  dataSource: PeriodicElement[] = [];

  constructor(
    public dialog: MatDialog,
    private authData: AuthService,
    private courseData: CoursesService,
    private countData: CountsService,
    private paymentData: PaymentService,
  ) {
    this.teacherID = this.authData.getUserId();
  }

  ngOnInit(): void {
    this.getAllTeacherCourses();
    this.getWalletBalance();
  }

  getWalletBalance() {
    this.paymentData.getWalletBalance(this.authData.getUserId())
      .subscribe(balance => {
        this.balance = balance;
      });
  }

  getAllTeacherCourses(): void {
    this.courseData.getAllTeacherCourses(this.teacherID).subscribe(
      courses => {
        this.courses = courses;
        // Fetch purchase times for each course
        const courseRequests: Observable<number>[] = [];
        this.courses.forEach(course => {
          courseRequests.push(this.countData.getCountStudentsPerCourse(course.id));
        });

        forkJoin(courseRequests).subscribe(purchaseTimes => {
          this.dataSource = this.courses.map((course, index) => ({
            courseID: course.id,
            courseName: course.courseName,
            price: course.price,
            purchaseTimes: purchaseTimes[index],
            thumbnail: course.thumbnail,
            subjectId: course.subjectId
          }));
        });
      },
      (error: any) => {
        console.error('Error loading courses:', error);
      }
    );
  }

  openDeleteCourseConfirmationDialog(courseID: number): void {
    console.log(courseID)
    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        message: 'هل أنت متأكد أنك تريد حذف الكورس؟',
        confirmButtonText: 'حذف الكورس',
        courseId: courseID,
        deleteType: "course"
      }
    });
  }

  openAddEditCourseConfirmationDialog(course?: ICourse): void {
    this.dialog.open(AddEditCourseComponent, {
      // minWidth: '100%',
      maxHeight: 'calc(100vh - 40px)',
      data: {
        message: 'هل أنت متأكد أنك تريد حذف الكورس؟',
        confirmButtonText: course?.id ? 'تعديل الكورس' : 'اضافه كورس',
        course: course,
      }
    });
  }
}

export interface PeriodicElement {
  courseName: string;
  price: number;
  purchaseTimes: number;
  thumbnail: string;
}
