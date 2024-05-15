import { Component, OnInit } from '@angular/core';
import { ICourse } from 'src/app/Model/icourse';
import { trigger, style, transition, animate } from '@angular/animations';
import { CoursesService } from 'src/app/Services/Courses/courses.service';

@Component({
  selector: 'app-recent-courses',
  templateUrl: './recent-courses.component.html',
  styleUrls: ['./recent-courses.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-200%)' }),
        animate('300ms', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
    ])
  ]
})
export class RecentCoursesComponent implements OnInit {
  courses: ICourse[] = [];
  filteredCourses: ICourse[] = [];
  courseType: string[] = [];

  options: { courseType: string; selected: boolean; }[] = [];

  currentIndex = 0;
  cardsToShow = 18;

  translations = {
    'Literature': 'أدبي',
    'General': 'عام',
    'Scientific': 'علمي'
  };

  constructor(private courseData: CoursesService) { }

  ngOnInit(): void {
    this.getCoursesOrderedByCreationDateDescending();

    this.courseData.getAllCourses().subscribe(courses => {
      this.courseType = [...new Set(courses.map(course => course.courseType))];
      this.options = this.courseType.map((subject, index) => ({ courseType: subject, selected: index === 0 }));

      this.toggleOption(0);
    });
  }

  getCoursesOrderedByCreationDateDescending() {
    this.courseData.getCoursesOrderedByCreationDateDescending().subscribe(courses => {
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
    const selectedOption = this.options.find(option => option.selected);

    if (selectedOption) {
      const selectedCourseType = selectedOption.courseType;
      this.filteredCourses = this.courses.filter(course => course.courseType === selectedCourseType);
    }
  }

  translateType(type: string): string {
    return (this.translations[type as keyof typeof this.translations] || type) as string;
  }
}
