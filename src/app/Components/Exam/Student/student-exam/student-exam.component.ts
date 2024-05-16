import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { ILecture } from 'src/app/Model/icourse';
import { IExam, IQuestion } from 'src/app/Model/iexam';
import { AuthService } from 'src/app/Services/Auth/auth.service';
import { ExamService } from 'src/app/Services/Exam/exam.service';
import { LecturesService } from 'src/app/Services/Lectures/lectures.service';

import { atLeastOneCheckboxChecked, atLeastOneRadioButtonChecked } from 'src/app/Validator/exam-validators';

@Component({
  selector: 'app-student-exam',
  templateUrl: './student-exam.component.html',
  styleUrls: ['./student-exam.component.css']
})
export class StudentExamComponent implements OnInit {
  courseId!: number;
  lectureId!: number;
  lecture!: ILecture;
  studentId!: string;
  examId!: number;
  exam!: IExam;
  questions!: IQuestion[];
  selectedQuestionIndex: number = 0;
  visitedQuestions: boolean[] = [];
  form: FormGroup;
  skippedQuestions: boolean[] = [];
  duration!: number;
  startData!: any;
  userId: string;
  loading = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private examData: ExamService,
    private lectureData: LecturesService,
    private studentData: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private userData: AuthService,
    private snackBar: MatSnackBar,
    private titleService: Title
  ) {
    this.form = this.fb.group({});
    this.userId = this.userData.getUserId();
  }

  ngOnInit(): void {
    const pageTitle = this.activatedRoute.snapshot.data['title'];
    this.titleService.setTitle(pageTitle);

    this.studentId = this.studentData.getUserId();

    this.activatedRoute.queryParamMap.subscribe(queryParams => {
      this.examId = +queryParams.get('examId')!;
      this.startExam(this.examId);
    });

    this.activatedRoute.params.subscribe(params => {
      this.courseId = +params['courseId'];
      this.lectureId = +params['lessonId'];
      this.getLectureById(this.lectureId);
    });

    this.visitedQuestions[0] = true;
  }

  startExam(id: number) {
    const student = {
      studentId: this.studentId
    }

    this.examData.startExam(id, student).subscribe(
      () => {
        console.log(`Exam : ${id} started successfully`);
        this.getExamById(this.examId);
      },
      (error) => {
        if (error.status !== 200) {
          console.error('Error occurred while starting exam:', error);
          if (error.status === 404 || error.status === 403 || error.status === 400) {
            this.closePage();
          }
        }
      }
    );
  }

  getExamById(id: number) {
    this.examData.getExamById(id).subscribe(exam => {
      this.exam = exam;
      this.questions = exam.questions;
      this.buildFormControls();
      this.getStartData(this.examId, this.studentId);
    });
  }

  getStartData(id: number, student: any) {
    this.examData.getDurationExam(id, student).subscribe(
      startData => {
        this.startData = startData;
        // console.log(startData)
        if(!this.startData.endTime){
          this.duration = this.exam.duration - durationCalculation(this.startData.startTime);
        }else{
          this.duration = 0;
          this.submitExam(this.examId);
        }
      },
    );
  }

  getLectureById(id: number) {
    this.lectureData.getLectureById(this.courseId, id, this.userId).subscribe(lecture => {
      this.lecture = lecture;
    });
  }

  buildFormControls() {
    const formControls: { [key: string]: any } = {};
    this.exam.questions.forEach((question, i) => {
      const questionControls: { [key: string]: any } = {};
      question.answers.forEach((answer, j) => {
        if (question.type === 'MultipleChoice') {
          questionControls['answer_' + i + '_' + j] = new FormControl(false);
        } else {
          questionControls['answer_' + i] = new FormControl(null);
        }
      });
      formControls['question_' + i] = new FormGroup(questionControls);
      if (question.type === 'MultipleChoice') {
        formControls['question_' + i].setValidators(atLeastOneCheckboxChecked());
      } else {
        formControls['question_' + i].setValidators(atLeastOneRadioButtonChecked());
      }
    });
    this.form = this.fb.group(formControls);
  }

  selectQuestion(index: number) {
    if (index === 0 || this.visitedQuestions[index]) {
      this.selectedQuestionIndex = index;
    }
  }

  navigateBack() {
    if (this.selectedQuestionIndex > 0) {
      this.selectedQuestionIndex--;
    }
  }

  skipQuestion() {
    this.visitedQuestions[this.selectedQuestionIndex + 1] = true;
    this.skippedQuestions[this.selectedQuestionIndex] = true;
    this.selectedQuestionIndex++;
  }

  updateQuestionButtonClasses(index: number, addClass: string, removeClass: string) {
    const buttons = document.querySelectorAll('.circle-button');
    buttons.forEach((button, i) => {
      if (i === index) {
        button.classList.add(addClass);
        button.classList.remove(removeClass);
      }
    });
  }

  navigateForward() {
    if (this.selectedQuestionIndex === this.exam.questions.length - 1) {
      this.submitExam(this.examId);
    }

    this.form.get('question_' + this.selectedQuestionIndex)?.markAllAsTouched();

    if (this.form.get('question_' + this.selectedQuestionIndex)?.invalid) {
      return;
    }

    this.visitedQuestions[this.selectedQuestionIndex] = true;

    if (!this.visitedQuestions[this.selectedQuestionIndex + 1] && !this.skippedQuestions[this.selectedQuestionIndex + 1]) {
      this.visitedQuestions[this.selectedQuestionIndex + 1] = true;
    }

    this.selectedQuestionIndex++;

    this.updateQuestionButtonClasses(this.selectedQuestionIndex - 1, 'solved', 'skipped');
  }

  getSelectedAnswersIdsAndIndex(questionId: number): { answerIds: number[], questionIndex: number }[] {
    const selectedAnswersIdsAndIndex: { answerIds: number[], questionIndex: number }[] = [];
    const question = this.exam.questions.find(q => q.id === questionId);

    if (question) {
      const formControls = this.form.controls;
      const controlKeys = Object.keys(formControls).filter(key => key.startsWith('question_'));

      controlKeys.forEach(key => {
        const questionIndex = parseInt(key.split('_')[1]);

        if (questionIndex !== -1 && questionIndex < this.exam.questions.length) {
          const questionFormGroup = formControls[key] as FormGroup;

          if (question.type === 'MultipleChoice') {
            // Get all selected checkboxes for this question
            const selectedCheckboxes = Object.keys(questionFormGroup.controls)
              .filter(controlKey => questionFormGroup.get(controlKey)?.value === true);

            // Extract answer ids from the selected checkboxes
            const answerIds = selectedCheckboxes.map(controlKey => {
              const answerIndex = parseInt(controlKey.split('_')[2]);
              return question.answers[answerIndex].id;
            });

            selectedAnswersIdsAndIndex.push({ answerIds, questionIndex });
          } else {
            // For single choice or true/false, only one answer can be selected
            const answerControl = questionFormGroup.get('answer_' + questionIndex);
            if (answerControl && answerControl.value !== null) {
              const answerId = question.answers.find(answer => answer.header === answerControl.value)?.id;
              if (answerId !== undefined) {
                selectedAnswersIdsAndIndex.push({ answerIds: [answerId], questionIndex });
              }
            }
          }
        }
      });
    }

    return selectedAnswersIdsAndIndex;
  }

  formattedExam() {
    const formattedExam: any = {
      studentId: this.studentId,
      answers: []
    };

    const selectedAnswersMap = new Map<number, number[]>();

    this.exam.questions.forEach(question => {
      const selectedAnswers = this.getSelectedAnswersIdsAndIndex(question.id);

      selectedAnswers.forEach(selectedAnswer => {
        const existingAnswers = selectedAnswersMap.get(selectedAnswer.questionIndex) || [];
        existingAnswers.push(...selectedAnswer.answerIds);
        selectedAnswersMap.set(selectedAnswer.questionIndex, existingAnswers);
      });
    });

    selectedAnswersMap.forEach((selectedAnswerIds, questionIndex) => {
      formattedExam.answers.push({
        questionId: this.exam.questions[questionIndex].id,
        selectedAnswersIds: selectedAnswerIds
      });
    });

    return formattedExam;
  }

  submitExam(examId: number) {
    const formattedExam = this.formattedExam();
    this.loading = true;

    this.examData.submitExam(examId, formattedExam).subscribe(
      (response) => {
        console.log('Exam submitted successfully:', response);
        this.getExamResult(this.examId);
      },
      (error) => {
        if (error.status !== 200) {
          console.error('Error occurred while submitting exam:', error);
        } else {
          this.getExamResult(this.examId);
        }
      }
    );
  }

  getExamResult(examId: number) {
    this.examData.getSubmissionExam(examId, this.studentData.getUserId()).subscribe(result => {
      this.loading = false;

      const navigationExtras: NavigationExtras = {
        queryParams: { result: JSON.stringify(result) },
        replaceUrl: true
      };
      this.router.navigate(['/course', this.courseId, 'lesson', this.lectureId, 'result'], navigationExtras);
    });
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });
  }

  closePage() {
    this.openSnackBar('غير متاح او لا يمكن الوصول', 'حسناً');

    setTimeout(() => {
      this.goBackAndRemoveCurrentRoute();
    }, 2000);
  }

  goBackAndRemoveCurrentRoute(): void {
    window.history.back();
    window.history.replaceState(null, '', this.router.url);
  }
}

export const durationCalculation = (startTime: number): number => {
  const currentDateTime = new Date();
  const startDateTimeString = startTime;

  const startDateTime = new Date(startDateTimeString);

  const timeDifferenceInMills = currentDateTime.getTime() - startDateTime.getTime();

  return Math.floor(timeDifferenceInMills / (1000 * 60));
}
