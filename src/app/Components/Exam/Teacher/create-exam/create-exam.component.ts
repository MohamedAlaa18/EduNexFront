import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { IExam } from 'src/app/Model/iexam';
import { ExamService } from 'src/app/Services/Exam/exam.service';
import { isAnyValueMissing, isDurationValid, isStartDateAfterEndDate, isStartDatePast } from 'src/app/Validator/exam-validators';

@Component({
  selector: 'app-create-exam',
  templateUrl: './create-exam.component.html',
  styleUrls: ['./create-exam.component.css']
})
export class CreateExamComponent implements OnInit {
  examForm!: FormGroup;
  activeSection: string = 'questionSettings';
  activeQuestions: boolean[] = [];
  activeQuestionIndex: number = 0;
  questionIndex: number = 0;
  questions: any[] = [];
  selectedValue: number = 10;
  courseTitle!: string;
  lectureTitle!: string;
  questionsControls!: FormArray;

  formSubmitted: boolean = false;

  constructor(private fb: FormBuilder, private activatedRoute: ActivatedRoute, private examData: ExamService, private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.examForm = this.fb.group({
      examId: [this.questionIndex],
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
        isStartDateAfterEndDate,
        isStartDatePast,
        isDurationValid
      ]
    });

    this.examForm.get('questionIndex')?.valueChanges.subscribe((index: number) => {
      this.activeQuestionIndex = index;
      this.updateAnswersControls();
    });

    this.questionsControls = this.examForm.get('questions') as FormArray;
    for (let i = 0; i < this.questionsControls.length; i++) {
      this.activeQuestions.push(false);
    }

    this.activatedRoute.queryParams.subscribe(params => {
      const startDate = params['startDate'] ? new Date(params['startDate']) : new Date();
      const endDate = params['endDate'] ? new Date(params['endDate']) : new Date();

      this.examForm.patchValue({
        title: params['title'] || '',
        startTime: params['startTime'] || '',
        endTime: params['endTime'] || '',
        startDate: startDate,
        endDate: endDate,
        duration: params['duration'] || ''
      });

      this.courseTitle = params['courseTitle'] || '';
      this.lectureTitle = params['lectureTitle'] || '';
    });
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
      answers: this.fb.array([])
    });
  }

  createAnswerFormGroup(answer: any, questionType: string, index: number): FormGroup {
    let headerValue = '';
    if (questionType === 'trueFalse') {
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
      answersFormArray.push(this.createAnswerFormGroup({}, questionType, answersFormArray.length));
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
      if ((questionType === 'oneChoice' || questionType === 'trueFalse') && isTrueAnswer) {
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
    this.snackBar.open(message, action, {
      duration: 2000,
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }

  // Function to combine date and time into a single variable
  combineDateTime(dateControl: AbstractControl | null, timeControl: AbstractControl | null): string {
    if (!dateControl || !timeControl) {
      console.error('Date or time control is missing.');
      return '';
    }

    const date = dateControl.value;
    const time = timeControl.value;

    if (!date || !time) {
      console.error('Date or time value is missing.');
      return '';
    }

    const dateTime = new Date(date);
    dateTime.setHours(Number(time.split(':')[0])); // Convert hours to number
    dateTime.setMinutes(Number(time.split(':')[1])); // Convert minutes to number
    dateTime.setSeconds(0);
    return dateTime.toISOString();
  }

  onSaveClicked(): void {
    this.examForm.markAllAsTouched();
    this.formSubmitted = true;

    if (this.examForm.valid) {
      console.log('Form submitted successfully!');

      // Combine date and time for startDateTime
      const startDateTime = this.combineDateTime(this.examForm.get('startDate'), this.examForm.get('startTime'));

      // Combine date and time for endDateTime
      const endDateTime = this.combineDateTime(this.examForm.get('endDate'), this.examForm.get('endTime'));

      // Retrieve type from params
      const params = this.activatedRoute.snapshot.queryParams;
      const type = params['type'];

      // Convert duration to number
      const duration = Number(this.examForm.get('duration')!.value);

      const examData = {
        ...this.examForm.value,
        type: type, // Add type to examData
        startDateTime: startDateTime,
        endDateTime: endDateTime,
        duration: duration, // Convert duration to number
        lectureId: Number(this.activatedRoute.snapshot.paramMap.get('lessonId'))
      };

      // Remove startDate, endDate, startTime, and endTime from examData
      delete examData.startDate;
      delete examData.endDate;
      delete examData.startTime;
      delete examData.endTime;

      console.log(examData);

      this.examData.addExam(examData).subscribe(
        (addedExam: IExam) => {
          console.log('Exam added successfully:', addedExam);
        },
        (error) => {
          console.error('Error occurred while adding exam:', error);
        }
      );
    } else {
      console.log('Form validation failed.');
      this.displayErrorMessages();
    }
  }
}

