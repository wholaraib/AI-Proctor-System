import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Grid, CircularProgress } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import BlankCard from 'src/components/shared/BlankCard';
import MultipleChoiceQuestion from './Components/MultipleChoiceQuestion';
import NumberOfQuestions from './Components/NumberOfQuestions';
import WebCam from './Components/WebCam';
import { useGetExamsQuery, useGetQuestionsQuery } from '../../slices/examApiSlice';
import { useSaveCheatingLogMutation } from 'src/slices/cheatingLogApiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const TestPage = () => {
  const { examId } = useParams();
  const [selectedExam, setSelectedExam] = useState([]);
  const [examDurationInSeconds, setExamDurationInSeconds] = useState(0);
  const { data: userExamData } = useGetExamsQuery();
  const [questions, setQuestions] = useState([]);
  const { data, isLoading, error } = useGetQuestionsQuery(examId);
  const [score, setScore] = useState(0);
  const navigate = useNavigate();

  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();
  const { userInfo } = useSelector((state) => state.auth);
  const [cheatingLog, setCheatingLog] = useState({
    noFaceCount: 0,
    multipleFaceCount: 0,
    cellPhoneCount: 0,
    ProhibitedObjectCount: 0,
    username: '',
    email: '',
  });

  const [tabSwitchTimeout, setTabSwitchTimeout] = useState(null);

  useEffect(() => {
    if (userExamData) {
      const exam = userExamData.find((exam) => exam.examId === examId);
      if (exam) {
        setSelectedExam(exam);
        setExamDurationInSeconds(exam.duration * 60);
        setCheatingLog((prevLog) => ({
          ...prevLog,
          examId: examId,
        }));
      }
    }
  }, [userExamData, examId]);

  useEffect(() => {
    if (data) {
      setQuestions(data);
    }
  }, [data]);

  const blockCopyPaste = (event) => {
    event.preventDefault();
    toast.warn('Copy, cut, and paste are disabled!');
  };

  useEffect(() => {
    document.addEventListener('copy', blockCopyPaste);
    document.addEventListener('cut', blockCopyPaste);
    document.addEventListener('paste', blockCopyPaste);

    return () => {
      document.removeEventListener('copy', blockCopyPaste);
      document.removeEventListener('cut', blockCopyPaste);
      document.removeEventListener('paste', blockCopyPaste);
    };
  }, []);

  useEffect(() => {
    enterFullscreen();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.warn('You switched tabs! Return to the test within 10 seconds or it will be terminated.', {
          autoClose: 10000,
        });

        const timeout = setTimeout(() => {
          if (document.hidden) {
            handleTestSubmission();
          }
        }, 10000);

        setTabSwitchTimeout(timeout);
      } else {
        clearTimeout(tabSwitchTimeout);
        setTabSwitchTimeout(null);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        toast.warn('You exited fullscreen! Return within 10 seconds or the test will be terminated.', {
          autoClose: 10000,
        });

        const timeout = setTimeout(() => {
          if (!document.fullscreenElement) {
            handleTestSubmission();
          }
        }, 10000);

        setTabSwitchTimeout(timeout);
      } else {
        clearTimeout(tabSwitchTimeout);
        setTabSwitchTimeout(null);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      clearTimeout(tabSwitchTimeout);
    };
  }, [tabSwitchTimeout]);

  const enterFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().catch((err) => console.error('Fullscreen request failed: ', err));
    }
  };

  const handleTestSubmission = async () => {
    try {
      setCheatingLog((prevLog) => ({
        ...prevLog,
        username: userInfo.name,
        email: userInfo.email,
      }));

      await saveCheatingLogMutation(cheatingLog).unwrap();
      toast.success('Test submitted and cheating log saved!');
      navigate(`/Success`);
    } catch (error) {
      console.error('Error submitting test or saving log:', error);
    }
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <div>Error loading questions</div>;
  }

  return (
    <PageContainer title="TestPage" description="This is TestPage">
      <Box pt="3rem">
        <Grid container spacing={3}>
          <Grid item xs={12} md={7} lg={7}>
            <BlankCard>
              <Box
                width="100%"
                minHeight="400px"
                boxShadow={3}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
              >
                {questions.length === 0 ? (
                  <div>No questions available</div>
                ) : (
                  <MultipleChoiceQuestion
                    submitTest={handleTestSubmission}
                    questions={questions}
                    saveUserTestScore={() => setScore(score + 1)}
                  />
                )}
              </Box>
            </BlankCard>
          </Grid>
          <Grid item xs={12} md={5} lg={5}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <BlankCard>
                  <Box
                    maxHeight="300px"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'start',
                      justifyContent: 'center',
                      overflowY: 'auto',
                      height: '100%',
                    }}
                  >
                    <NumberOfQuestions
                      questionLength={questions.length}
                      submitTest={handleTestSubmission}
                      examDurationInSeconds={examDurationInSeconds}
                    />
                  </Box>
                </BlankCard>
              </Grid>
              <Grid item xs={12}>
                <BlankCard>
                  <Box
                    width="300px"
                    maxHeight="180px"
                    boxShadow={3}
                    display="flex"
                    flexDirection="column"
                    alignItems="start"
                    justifyContent="center"
                  >
                    <WebCam cheatingLog={cheatingLog} updateCheatingLog={setCheatingLog} />
                  </Box>
                </BlankCard>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default TestPage;
