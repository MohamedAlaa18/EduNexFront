import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/Services/Auth/auth.service';
import { CoursesService } from 'src/app/Services/Courses/courses.service';

@Component({
  selector: 'app-student-course',
  templateUrl: './student-course.component.html',
  styleUrls: ['./student-course.component.css']
})
export class StudentCourseComponent implements OnInit {
  displayedColumns: string[] = ['Course'];
  course: PeriodicElement[] = [];

  constructor(private courseData: CoursesService, private studentData: AuthService) { }

  ngOnInit(): void {
    this.getCourseById();
  }

  getCourseById() {
    this.courseData.getCoursesEnrolledByStudent(this.studentData.getUserId()).subscribe((courses: any) => {
      // Assign courses data to the course property
      this.course = courses.map((course: any) => {
        return {
          courseId:course.courseId,
          courseName: course.courseName,
          courseThumbnail: course.courseThumbnail
        };
      });
      // console.log(this.course);
    });
  }
}

export interface PeriodicElement {
  course: string;
  image: string;
}
