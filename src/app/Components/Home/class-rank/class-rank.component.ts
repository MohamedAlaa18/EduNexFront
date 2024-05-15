import { Component, OnInit } from '@angular/core';
import { ExamService } from 'src/app/Services/Exam/exam.service';

@Component({
  selector: 'app-class-rank',
  templateUrl: './class-rank.component.html',
  styleUrls: ['./class-rank.component.css']
})
export class ClassRankComponent implements OnInit {
  rankData: any[] = [];

  constructor(
    private examData: ExamService,
  ) { }

  ngOnInit(): void {
    this.getCourseById();
  }

  getCourseById() {
    this.examData.getStudentsOrderedByScore().subscribe(rankData => {
      this.rankData = rankData;
    });
  }
}
