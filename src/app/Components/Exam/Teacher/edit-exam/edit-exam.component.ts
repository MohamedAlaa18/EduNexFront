import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { convertDateFormat, convertTimeFormat } from 'src/app/Components/Exam/DateTimeFormat';
import { ILecture } from 'src/app/Model/icourse';
import { IExam } from 'src/app/Model/iexam';
import { AuthService } from 'src/app/Services/Auth/auth.service';
import { ExamService } from 'src/app/Services/Exam/exam.service';
import { LecturesService } from 'src/app/Services/Lectures/lectures.service';
import { isAnyValueMissing, isDurationValid, isStartDateBeforeEndDate, isStartDateInFuture } from 'src/app/Validator/exam-validators';

@Component({
  selector: 'app-edit-exam',
  templateUrl: './edit-exam.component.html',
  styleUrls: ['./edit-exam.component.css']
})
export class EditExamComponent implements OnInit {
  exam!: IExam;
  lecture!: ILecture;
  examForm!: FormGroup;
  activeSection: string = 'questionSettings';
  activeQuestions: boolean[] = [];
  activeQuestionIndex: number = 0;
  questionIndex: number = 0;
  questions: any[] = [];
  selectedValue: number = 10;
  courseTitle!: string;
  questionsControls!: FormArray;
  userId: string;
  formSubmitted: boolean = false;

  constructor(
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private examData: ExamService,
    private lectureData: LecturesService,
    private snackBar: MatSnackBar,
    private userData: AuthService,
    private router: Router,
    private titleService: Title
  ) {
    this.userId = this.userData.getUserId();
  }

  ngOnInit(): void {
    const pageTitle = this.activatedRoute.snapshot.data['title'];
    this.titleService.setTitle(pageTitle);

    this.initForm();

    this.examForm.get('questionIndex')?.valueChanges.subscribe((index: number) => {
      this.activeQuestionIndex = index;
      this.updateAnswersControls();
    });

    this.questionsControls = this.examForm.get('questions') as FormArray;
    for (let i = 0; i < this.questionsControls.length; i++) {
      this.activeQuestions.push(false);
    }

    this.activatedRoute.queryParams.subscribe(params => {
      this.getExamById(params['examId']);
    });

    this.getLectureId(Number(this.activatedRoute.snapshot.paramMap.get('courseId')), Number(this.activatedRoute.snapshot.paramMap.get('lessonId')));
  }

  getExamById(id: number) {
    this.examData.getExamById(id).subscribe(
      exam => {
        this.exam = exam;
        this.getExamDate(exam);
      },
      error => {
        if (error.status === 404 || error.status === 403) {
          this.closePage();
        } else {
          console.error('Error fetching Exam:', error);
        }
      });
  }

  getLectureId(courseId: number, lectureId: number) {
    this.lectureData.getLectureById(courseId, lectureId, this.userId).subscribe(
      lecture => {
        this.lecture = lecture;
      },
      error => {
        if (error.status === 404 || error.status === 403) {
          this.closePage();
        } else {
          console.error('Error fetching Exam:', error);
        }
      });
  }

  initForm(): void {
    this.examForm = this.fb.group({
      id: [this.questionIndex],
      title: ['', [Validators.required, Validators.pattern(/^[\u0600-\u06FF\u0750-\u077F\s0-9a-zA-Z]+$/)]],
      startDate: [new Date(), Validators.required],
      endDate: [new Date(), Validators.required],
      startTime: [0, Validators.required],
      endTime: [0, Validators.required],
      duration: [0, [Validators.required, Validators.min(5), Validators.max(180)]],
      questions: this.fb.array([]),
    }, {
      validators: [
        isAnyValueMissing,
        isStartDateBeforeEndDate,
        // isStartDateInFuture,
        isDurationValid,
      ]
    });
  }

  initQuestions(): void {
    const questionsArray = this.examForm.get('questions') as FormArray;
    this.exam.questions.forEach(question => {
      const questionGroup = this.fb.group({
        points: [question.points, Validators.required],
        header: [question.header, Validators.required],
        type: [question.type, Validators.required],
        answers: this.fb.array([])
      });

      const answersArray = questionGroup.get('answers') as FormArray;
      question.answers.forEach(answer => {
        answersArray.push(this.fb.group({
          header: [answer.header, Validators.required],
          isCorrect: answer.isCorrect
        }));
      });

      questionsArray.push(questionGroup);
    });
  }

  getExamDate(exam: IExam) {
    const startDateTime = new Date(exam.startDateTime);
    const endDateTime = new Date(exam.endDateTime);

    this.examForm.patchValue({
      title: exam.title || '',
      startDate: startDateTime || '',
      endDate: endDateTime || '',
      startTime: this.formatTime(startDateTime) || '',
      endTime: this.formatTime(endDateTime) || '',
      duration: exam.duration
    });

    this.courseTitle = exam.title;

    this.initQuestions();
  }

  formatTime(date: Date): string {
    return `${this.padZero(date.getHours())}:${this.padZero(date.getMinutes())}`;
  }

  padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  //getFormGroup
  get questionFormGroup(): FormGroup {
    if (this.questionIndex >= 0 && this.questionIndex < this.questionsControls.length) {
      return this.questionsControls.at(this.questionIndex) as FormGroup;
    } else {
      return this.fb.group({});
    }
  }

  getQuestionFormGroup(index: number): FormGroup {
    return this.questionsControls.at(index) as FormGroup;
  }

  getAnswerFormGroup(questionIndex: number, answerIndex: number): FormGroup {
    const questionFormGroup = this.getQuestionFormGroup(questionIndex);
    if (!questionFormGroup) {
      console.error('Question form group not found.');
      return this.fb.group({});
    }

    const answersFormArray = questionFormGroup.get('answers') as FormArray;
    if (!answersFormArray) {
      console.error('Answers form array not found.');
      return this.fb.group({});
    }

    if (answerIndex >= 0 && answerIndex < answersFormArray.length) {
      return answersFormArray.at(answerIndex) as FormGroup;
    } else {
      console.error('Answer form group not found.');
      return this.fb.group({});
    }
  }

  //createFormGroup
  private createAnswerFormArray(): FormArray {
    return this.fb.array([]);
  }

  createQuestionFormGroup(): FormGroup {
    return this.fb.group({
      points: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      header: ['', [Validators.required, Validators.pattern(/^[\u0600-\u06FF\u0750-\u077F\s0-9a-zA-Z]+$/)]],
      type: ['', Validators.required],
      answers: this.fb.array([], [this.validateAnswersLength])
    });
  }

  createAnswerFormGroup(answer: any, questionType: string, index: number): FormGroup {
    let headerValue = '';
    if (questionType === 'TrueFalse') {
      headerValue = index === 0 ? 'صح' : 'خطأ';
    }

    return this.fb.group({
      header: [headerValue, Validators.required],
      isCorrect: [answer?.isCorrect || null, Validators.required]
    }) as FormGroup;
  }

  //getFormControls
  getFormArrayControls(control: AbstractControl | null): AbstractControl[] {
    if (control instanceof FormArray) {
      return control.controls;
    }
    return [];
  }

  getAnswersControls(): FormArray | undefined {
    if (this.questionIndex === -1) {
      console.error('No question selected.');
      return;
    }
    const questionsFormArray = this.examForm.get('questions') as FormArray;
    const questionControl = questionsFormArray.at(this.questionIndex);
    if (!questionControl) {
      // console.error(`Question index ${this.questionIndex} is out of bounds.`);
      return;
    }
    let answersArray = questionControl.get('answers') as FormArray;
    if (!answersArray) {
      answersArray = this.createAnswerFormArray();
      questionControl.patchValue({ answers: answersArray });
    }
    return answersArray;
  }

  //getAnswers
  getAnswersForActiveQuestion(): FormArray | undefined {
    if (this.activeQuestionIndex === -1) {
      console.error('No active question selected.');
      return;
    }
    const activeQuestionFormGroup = this.getQuestionFormGroup(this.activeQuestionIndex);
    if (!activeQuestionFormGroup) {
      console.error('Active question form group not found.');
      return;
    }
    return activeQuestionFormGroup.get('answers') as FormArray;
  }

  //remove from Form
  removeAnswer(questionIndex: number, answerIndex: number): void {
    const activeQuestionFormGroup = this.getQuestionFormGroup(questionIndex);
    const answersFormArray = activeQuestionFormGroup.get('answers') as FormArray;

    if (!answersFormArray) {
      console.error('Answers form array not found.');
      return;
    }

    answersFormArray.removeAt(answerIndex);
  }

  removeQuestion(index: number): void {
    this.questionsControls.removeAt(index);
    this.activeQuestions.splice(index, 1);
  }

  //add in Form
  addQuestion(): void {
    const questionFormGroup = this.createQuestionFormGroup();
    this.questionsControls.push(questionFormGroup);
  }

  addAnswer(questionIndex: number): void {
    const activeQuestionFormGroup = this.getQuestionFormGroup(questionIndex);

    if (!activeQuestionFormGroup) {
      console.error('Active question form group not found.');
      return;
    }

    const questionType = activeQuestionFormGroup.get('type')?.value;

    if (!questionType) {
      console.error('Question type not found.');
      return;
    }

    const answersFormArray = activeQuestionFormGroup.get('answers') as FormArray;

    if (!answersFormArray) {
      console.error('Answers form array not found.');
      return;
    }

    if (!this.isAnswersLimitReached(questionIndex)) {
      if (questionType === 'TrueFalse') {
        answersFormArray.push(this.createAnswerFormGroup({ text: 'True', isCorrect: false }, questionType, answersFormArray.length));
        answersFormArray.push(this.createAnswerFormGroup({ text: 'False', isCorrect: false }, questionType, answersFormArray.length));
      } else {
        answersFormArray.push(this.createAnswerFormGroup({}, questionType, answersFormArray.length));
      }
    } else {
      console.error('Maximum number of answers reached.');
      return;
    }
  }

  onAddQuestionClicked(): void {
    const questionsFormArray = this.examForm.get('questions') as FormArray;
    questionsFormArray.push(this.createQuestionFormGroup());
    this.examForm.markAsDirty();
  }

  updateAnswersControls(): void {
    const activeQuestionFormGroup = this.getQuestionFormGroup(this.activeQuestionIndex);
    if (!activeQuestionFormGroup) {
      console.error('Active question form group not found.');
      return;
    }

    const answersFormArray = activeQuestionFormGroup.get('answers') as FormArray;
    if (!answersFormArray) {
      console.error('Answers form array not found.');
      return;
    }
  }

  handleQuestionIndexClicked(index: number): void {
    if (index != this.activeQuestionIndex) {
      this.activeQuestions[index] = !this.activeQuestions[index];
      this.activeQuestionIndex = this.activeQuestionIndex === index ? -1 : index;
      this.activeSection = 'questionSettings';
    }
  }

  // This method handles the selection of answers and checks if at least one answer is marked as correct
  handleAnswerSelection(questionIndex: number, selectedAnswerIndex: number, isTrueAnswer: boolean): void {
    const questionFormGroup = this.getQuestionFormGroup(questionIndex);
    if (questionFormGroup) {
      const questionType = questionFormGroup.get('type')?.value;
      if ((questionType === 'OneChoice' || questionType === 'TrueFalse') && isTrueAnswer) {
        const answersFormArray = questionFormGroup.get('answers') as FormArray;
        if (answersFormArray) {
          for (let i = 0; i < answersFormArray.length; i++) {
            if (i !== selectedAnswerIndex) {
              const answerFormGroup = answersFormArray.at(i) as FormGroup;
              const isCorrectControl = answerFormGroup.get('isCorrect');
              if (isCorrectControl) {
                isCorrectControl.setValue(false);
              }
            }
          }
        }
      }
      const answerFormGroup = this.getAnswerFormGroup(questionIndex, selectedAnswerIndex);
      if (answerFormGroup) {
        const isCorrectControl = answerFormGroup.get('isCorrect');
        if (isCorrectControl) {
          isCorrectControl.setValue(isTrueAnswer);
          // Check if at least one answer is marked as true
          const anyTrue = this.checkAnyTrue(questionIndex);
          if (anyTrue) {
            // Clear error if any checkbox is checked as "true"
            this.clearErrorMessages(questionIndex);
          } else {
            // Set error if all checkboxes are marked as false
            this.setErrorMessages(questionIndex);
          }
        }
      }
    }
  }

  // Method to check if at least one answer is marked as true
  checkAnyTrue(questionIndex: number): boolean {
    const questionFormGroup = this.getQuestionFormGroup(questionIndex);
    if (questionFormGroup) {
      const answersFormArray = questionFormGroup.get('answers') as FormArray;
      if (answersFormArray) {
        for (let i = 0; i < answersFormArray.length; i++) {
          const answerFormGroup = answersFormArray.at(i) as FormGroup;
          const isCorrectControl = answerFormGroup.get('isCorrect');
          if (isCorrectControl && isCorrectControl.value) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Method to set the error message for all checkboxes when all are marked as false
  setErrorMessages(questionIndex: number): void {
    const questionFormGroup = this.getQuestionFormGroup(questionIndex);
    if (questionFormGroup) {
      const answersFormArray = questionFormGroup.get('answers') as FormArray;
      if (answersFormArray) {
        for (let i = 0; i < answersFormArray.length; i++) {
          const answerFormGroup = answersFormArray.at(i) as FormGroup;
          const isCorrectControl = answerFormGroup.get('isCorrect');
          if (isCorrectControl && !isCorrectControl.value) {
            const errorMessageControl = answerFormGroup.get('isCorrect');
            if (errorMessageControl) {
              errorMessageControl.setErrors({ 'atLeastOneTrueFalseRequired': true });
            }
          }
        }
      }
    }
  }

  // Method to clear the error messages for all checkboxes
  clearErrorMessages(questionIndex: number): void {
    const questionFormGroup = this.getQuestionFormGroup(questionIndex);
    if (questionFormGroup) {
      const answersFormArray = questionFormGroup.get('answers') as FormArray;
      if (answersFormArray) {
        answersFormArray.controls.forEach(control => {
          const isCorrectControl = control.get('isCorrect');
          if (isCorrectControl && isCorrectControl.errors && isCorrectControl.errors['atLeastOneTrueFalseRequired']) {
            isCorrectControl.setErrors(null);
          }
        });
      }
    }
  }

  isAnswersLimitReached(questionIndex: number): boolean {
    const questionFormGroup = this.getQuestionFormGroup(questionIndex);
    if (!questionFormGroup) {
      return false;
    }

    const questionType = questionFormGroup.get('type')?.value;
    const answersLength = (questionFormGroup.get('answers') as FormArray)?.length ?? 0;

    return (
      (questionType === 'MultipleChoice' || questionType === 'OneChoice') && answersLength >= 4 ||
      (questionType === 'TrueFalse' && answersLength >= 2)
    );
  }

  validateAnswersLength(control: AbstractControl): { [key: string]: boolean } | null {
    const answersArray = control as FormArray;
    if (answersArray && answersArray.length < 2) {
      return { 'minAnswers': true };
    }
    return null;
  }

  //SnackBar
  displayErrorMessages(): void {
    const formErrors = this.examForm.errors;

    if (formErrors) {
      if (formErrors['anyValueMissing']) {
        this.openSnackBar('يرجى ملء جميع الحقول', 'حسناً');
      }
      if (formErrors['startDateAfterEndDate']) {
        this.openSnackBar('تاريخ البداية يجب أن يكون قبل تاريخ الانتهاء', 'حسناً');
      }
      if (formErrors['durationInvalid']) {
        this.openSnackBar('المدة المحددة أطول من المدة الفعلية للامتحان', 'حسناً');
      }
      if (formErrors['startDatePast']) {
        this.openSnackBar('يجب أن يكون تاريخ البداية في المستقبل', 'حسناً');
      }
    } else {
      Object.keys(this.examForm.controls).forEach(controlName => {
        const control = this.examForm.get(controlName);
        if (control && control.errors) {
          if (control.errors?.['required']) {
            this.openSnackBar('هذا الحقل مطلوب', 'حسناً');
          }
        }
      });
    }
  }

  openSnackBar(message: string, action: string): void {
    let verticalPosition: 'top' | 'bottom' = 'bottom';
    let horizontalPosition: 'start' | 'center' | 'end' | 'left' | 'right' = 'center';
    let panelClass: string[] = [];

    // Determine position based on message
    if (message === 'غير متاح او لا يمكن الوصول') {
      verticalPosition = 'top';
      horizontalPosition = 'center';
    } else {
      verticalPosition = 'bottom';
      horizontalPosition = 'right';
    }

    // Determine panel class based on message
    if (message === 'تم حفظ الامتحان') {
      panelClass.push('snackbar-success');
    }

    // Open Snackbar with specified configuration
    this.snackBar.open(message, action, {
      duration: 2000,
      verticalPosition: verticalPosition,
      horizontalPosition: horizontalPosition,
      panelClass: panelClass
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

  onSaveClicked(): void {
    this.examForm.markAllAsTouched();
    this.formSubmitted = true;

    if (this.examForm.valid) {
      console.log('Form submitted successfully!');

      const startDate = convertDateFormat(this.examForm.value.startDate);
      const endDate = convertDateFormat(this.examForm.value.endDate);

      const startTime = convertTimeFormat(this.examForm.value.startTime);
      const endTime = convertTimeFormat(this.examForm.value.endTime);

      // Convert duration to number
      const duration = Number(this.examForm.get('duration')!.value);

      // Get the id from the URL
      const params = this.activatedRoute.snapshot.queryParams;
      const id = params['examId'];

      const questionsData = this.examForm.value.questions.map((question: any, index: number) => {
        // Retrieve question ID if it exists
        const questionId = this.exam.questions && this.exam.questions.length > index ? this.exam.questions[index].id : null;

        // Map answers and add IDs
        const answersData = question.answers.map((answer: any, answerIndex: number) => {
          // Retrieve answer ID if it exists
          const answerId = this.exam.questions && this.exam.questions.length > index &&
            this.exam.questions[index].answers && this.exam.questions[index].answers.length > answerIndex ?
            this.exam.questions[index].answers[answerIndex].id : null;

          return {
            ...answer,
            id: answerId
          };
        });

        return {
          ...question,
          id: questionId,
          answers: answersData
        };
      });

      const examData = {
        ...this.examForm.value,
        type: this.exam.type,
        startDateTime: `${startDate}T${startTime}`,
        endDateTime: `${endDate}T${endTime}`,
        duration: duration,
        lectureId: Number(this.activatedRoute.snapshot.paramMap.get('lessonId')),
        questions: questionsData // Include the updated questions data with preserved IDs
      };

      // Remove startDate, endDate, startTime, and endTime from examData
      delete examData.startDate;
      delete examData.endDate;
      delete examData.startTime;
      delete examData.endTime;

      // Replace id with the one from the URL
      examData.id = Number(id);

      console.log(examData);
      this.openSnackBar('تم حفظ الامتحان', 'حسناً');

      this.examData.editExam(examData.id, examData).subscribe(
        (editedExam: any) => {
          console.log('Exam edited successfully:', editedExam);
          this.openSnackBar('تم حفظ الامتحان', 'حسناً');
        },
        (error) => {
          if (error.status == 200) {
            window.location.reload();
          }
          console.error('Error occurred while adding exam:', error);
        }
      );
    } else {
      console.log('Form validation failed.');
      this.displayErrorMessages();
    }
  }
}

