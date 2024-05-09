import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ILecture, IVideo, IAttachment } from 'src/app/Model/icourse';
import { AuthService } from 'src/app/Services/Auth/auth.service';
import { CoursesService } from 'src/app/Services/Courses/courses.service';
import { LecturesService } from 'src/app/Services/Lectures/lectures.service';

@Component({
  selector: 'app-lecture',
  templateUrl: './lecture.component.html',
  styleUrls: ['./lecture.component.css']
})
export class LectureComponent implements OnInit {
  lecture!: ILecture;
  courseId!: number;
  contentIndex: number = 0;
  panelOpenState = false;
  selected?: boolean;
  userId: string;
  role!: string;
  isEnrolled!: boolean;


  videoOptions: { label: string; selected: boolean; videoUrl: string; }[] = [];
  fileOptions: { label: string; pdfUrl: string; }[] = [];
  selectedVideoUrl: string = '';

  constructor(private activatedRoute: ActivatedRoute,
    private lectureService: LecturesService,
    private userData: AuthService,
    private courseData: CoursesService
  ) {
    this.userId = this.userData.getUserId();
  }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      this.courseId = params['courseId'];
      //  = params['lectureId'];
      const lectureId = Number(this.activatedRoute.snapshot.paramMap.get('id'));

      this.lectureService.getLectureById(this.courseId, lectureId, this.userId).subscribe(lecture => {
        this.lecture = lecture;
        // console.log(this.lecture)
        this.initOptions();
      });
    });
  }

  checkEnrollment() {
    this.courseData.checkEnrollment(this.courseId, this.userId).subscribe(isEnrolled => {
      // console.log(isEnrolled);
      this.isEnrolled = isEnrolled;
    });
  }

  initOptions() {
    if (this.lecture) {
      if (this.lecture.videos) {
        this.lecture.videos.forEach((video: IVideo, index: number) => {
          const isSelected = index === 0;
          this.videoOptions.push({ label: video.videoTitle, selected: isSelected, videoUrl: video.videoPath });
          if (isSelected) {
            this.selectedVideoUrl = video.videoPath;
          }
        });
      }

      if (this.lecture.attachments) {
        this.lecture.attachments.forEach((attachment: IAttachment) => {
          this.fileOptions.push({ label: attachment.attachmentTitle, pdfUrl: attachment.attachmentPath });
        });
      }
    }
  }

  toggleOption(index: number) {
    this.videoOptions.forEach((videoOption, i) => {
      videoOption.selected = i === index;
    });
    this.selectedVideoUrl = this.videoOptions[index].videoUrl;
  }

  isStudentAllowed() {
    return this.role === 'Student' && this.isEnrolled;
  }

}