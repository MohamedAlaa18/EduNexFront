import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { ICourse } from 'src/app/Model/icourse';
import { ITeacher } from 'src/app/Model/iteacher';
import { CoursesService } from 'src/app/Services/Courses/courses.service';
import { TeachersService } from 'src/app/Services/Teachers/teachers.service';

@Component({
  selector: 'app-teacher-details',
  templateUrl: './teacher-details.component.html',
  styleUrls: ['./teacher-details.component.css']
})
export class TeacherDetailsComponent implements OnInit {
  teacher!: ITeacher;
  teacherID!: string;
  courses: ICourse[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private teacherData: TeachersService,
    private courseData: CoursesService,
    private titleService: Title
  ) { }

  ngOnInit(): void {
    const pageTitle = this.activatedRoute.snapshot.data['title'];
    this.titleService.setTitle(pageTitle);

    this.activatedRoute.params.subscribe(params => {
      this.teacherID = params['id'];
      this.getTeacherById(this.teacherID);
    });
  }

  getTeacherById(teacherID: string) {
    this.teacherData.getTeacherById(teacherID).subscribe(teacher => {
      this.teacher = teacher;
      if (teacher) {
        this.getAllCoursesForTeacher(teacherID);
      }
    });
  }

  getAllCoursesForTeacher(teacherId: string) {
    this.courseData.getAllCourses().subscribe(courses => {
      this.courses = courses.filter(course => {
        return course.teacherId === teacherId;
      });
    });
  }
}
