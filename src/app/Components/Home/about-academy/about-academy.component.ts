import { Component, OnInit } from '@angular/core';
import { ICourse } from 'src/app/Model/icourse';
import { ITeacher } from 'src/app/Model/iteacher';
import { trigger, style, transition, animate } from '@angular/animations';
import { TeachersService } from 'src/app/Services/Teachers/teachers.service';
import { CoursesService } from 'src/app/Services/Courses/courses.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-about-academy',
  templateUrl: './about-academy.component.html',
  styleUrls: ['./about-academy.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-200%)' }),
        animate('300ms', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
    ])
  ]
})
export class AboutAcademyComponent implements OnInit {
  courses: ICourse[] = [];
  teachers: ITeacher[] = [];
  chosenCards: (ICourse | ITeacher)[] = [];

  options = [
    { label: 'أشهر الكورسات', selected: true },
    { label: 'أشهر المدسين', selected: false },
  ];

  currentIndex = 0;
  cardsToShow = 18;

  constructor(private teacherData: TeachersService, private courseData: CoursesService) { }

  isCourse(card: any): card is ICourse {
    return card.hasOwnProperty('teacherName')
  }

  ngOnInit(): void {
    forkJoin([
      this.teacherData.getAllTeachers(),
      this.courseData.getCoursesOrderedByEnrollment()
    ]).subscribe(([teachers, courses]) => {
      this.teachers = teachers;
      this.courses = courses;
      this.filterCourses();
    });
  }

  toggleOption(index: number) {
    this.options.forEach((option, i) => {
      option.selected = i === index;
    });
    this.currentIndex = 0;
    this.filterCourses();
  }

  filterCourses() {
    if (this.options[0].selected) {
      this.chosenCards = this.courses;
    } else if (this.options[1].selected) {
      this.chosenCards = this.teachers.map(teacher => {
        const teacherCourses = this.courses.filter(course => course.teacherId === teacher.id);
        return teacherCourses.length > 0 ? { ...teacher, courses: teacherCourses } : null;
      }).filter(Boolean) as ITeacher[];
    }
  }
}
