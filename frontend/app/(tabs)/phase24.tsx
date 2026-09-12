import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { TikTokColors } from '../../src/constants/tiktokTheme';

// FIX: this screen derived the API base URL locally from
// EXPO_PUBLIC_BACKEND_URL, which is defined nowhere (app.json has no
// `extra` block and no .env sets it), so the value was undefined and
// every request went to a URL literally starting with "undefined/".
// All screens now share src/config/backend.ts.
import { BACKEND_URL as backendUrl } from '../../src/config/backend';

export default function Phase24Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [quizTopic, setQuizTopic] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [tutorResponse, setTutorResponse] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);

  const createCourse = async () => {
    if (!courseTitle.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/education/course/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          title: courseTitle,
          description: 'Comprehensive course',
          modules: []
        })
      });
      const data = await response.json();
      if (data.success) {
        setCourses([data.course, ...courses]);
        setCourseTitle('');
      }
    } catch (error) {
      console.error('Create course error:', error);
    }
    setLoading(false);
  };

  const askAITutor = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/education/ai-tutor/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          question,
          subject: 'general'
        })
      });
      const data = await response.json();
      if (data.success) {
        setTutorResponse(data.tutor_response);
      }
    } catch (error) {
      console.error('AI tutor error:', error);
    }
    setLoading(false);
  };

  const generateQuiz = async () => {
    if (!quizTopic.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/education/quiz/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          topic: quizTopic,
          difficulty: 'medium',
          num_questions: 5
        })
      });
      const data = await response.json();
      if (data.success) {
        setQuiz(data.quiz);
      }
    } catch (error) {
      console.error('Generate quiz error:', error);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#3B82F6', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="school" size={48} color="white" />
        <Text style={styles.headerTitle}>Education & Learning</Text>
        <Text style={styles.headerSubtitle}>AI-powered education platform</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Create Course */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book" size={24} color="#3B82F6" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Create Course</Text>
          </View>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Course title..."
            placeholderTextColor={theme.textSecondary}
            value={courseTitle}
            onChangeText={setCourseTitle}
          />

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
            onPress={createCourse}
            disabled={loading || !courseTitle.trim()}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.actionButtonText}>Create Course</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* AI Tutor */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubbles" size={24} color="#8B5CF6" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Tutor (Grok 4.3)</Text>
          </View>
          
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Ask any question..."
            placeholderTextColor={theme.textSecondary}
            value={question}
            onChangeText={setQuestion}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
            onPress={askAITutor}
            disabled={loading || !question.trim()}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="sparkles" size={20} color="white" />
                <Text style={styles.actionButtonText}>Ask AI Tutor</Text>
              </>
            )}
          </TouchableOpacity>

          {tutorResponse && (
            <View style={[styles.responseBox, { backgroundColor: theme.background }]}>
              <View style={styles.responseHeader}>
                <Ionicons name="information-circle" size={20} color="#8B5CF6" />
                <Text style={[styles.responseTitle, { color: theme.text }]}>Tutor Response</Text>
              </View>
              <Text style={[styles.responseText, { color: theme.textSecondary }]}>{tutorResponse.answer}</Text>
              {tutorResponse.examples && (
                <View style={styles.examplesBox}>
                  <Text style={[styles.examplesTitle, { color: theme.text }]}>Examples:</Text>
                  {tutorResponse.examples.map((ex: string, idx: number) => (
                    <Text key={idx} style={[styles.exampleText, { color: theme.textSecondary }]}>• {ex}</Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Quiz Generator */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={24} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quiz Generator</Text>
          </View>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Quiz topic..."
            placeholderTextColor={theme.textSecondary}
            value={quizTopic}
            onChangeText={setQuizTopic}
          />

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={generateQuiz}
            disabled={loading || !quizTopic.trim()}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="flash" size={20} color="white" />
                <Text style={styles.actionButtonText}>Generate Quiz</Text>
              </>
            )}
          </TouchableOpacity>

          {quiz && (
            <View style={[styles.quizBox, { backgroundColor: theme.background }]}>
              <Text style={[styles.quizTitle, { color: theme.text }]}>{quiz.topic}</Text>
              <View style={styles.quizMeta}>
                <View style={styles.quizMetaItem}>
                  <Ionicons name="time" size={16} color="#10B981" />
                  <Text style={[styles.quizMetaText, { color: theme.textSecondary }]}>{quiz.time_limit / 60} min</Text>
                </View>
                <View style={styles.quizMetaItem}>
                  <Ionicons name="checkbox" size={16} color="#10B981" />
                  <Text style={[styles.quizMetaText, { color: theme.textSecondary }]}>{quiz.questions?.length} questions</Text>
                </View>
              </View>
              {quiz.questions?.map((q: any, idx: number) => (
                <View key={idx} style={styles.questionCard}>
                  <Text style={[styles.questionText, { color: theme.text }]}>{idx + 1}. {q.question}</Text>
                  {q.options?.map((opt: string, oidx: number) => (
                    <TouchableOpacity key={oidx} style={[styles.optionButton, { backgroundColor: theme.card }]}>
                      <Text style={[styles.optionText, { color: theme.textSecondary }]}>{String.fromCharCode(65 + oidx)}. {opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* My Courses */}
        {courses.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>My Courses</Text>
            {courses.map((course, idx) => (
              <View key={idx} style={[styles.courseCard, { backgroundColor: theme.background }]}>
                <View style={[styles.courseIcon, { backgroundColor: '#3B82F6' + '20' }]}>
                  <Ionicons name="book" size={24} color="#3B82F6" />
                </View>
                <View style={styles.courseInfo}>
                  <Text style={[styles.courseName, { color: theme.text }]}>{course.title}</Text>
                  <Text style={[styles.courseMeta, { color: theme.textSecondary }]}>0 students enrolled</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Learning Stats */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={24} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Progress</Text>
          </View>
          
          <View style={styles.statsGrid}>
            {[
              { label: 'Courses', value: '12', icon: 'book', color: '#3B82F6' },
              { label: 'Certificates', value: '5', icon: 'ribbon', color: '#10B981' },
              { label: 'Hours', value: '48', icon: 'time', color: '#8B5CF6' },
            ].map((stat, idx) => (
              <View key={idx} style={[styles.statCard, { backgroundColor: theme.background }]}>
                <Ionicons name={stat.icon as any} size={28} color={stat.color} />
                <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingTop: 60, alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginTop: 12 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  content: { padding: 16 },
  section: { borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  input: { borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 16 },
  textArea: { borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 16, minHeight: 80, textAlignVertical: 'top' },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  responseBox: { marginTop: 16, padding: 16, borderRadius: 12 },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  responseTitle: { fontSize: 15, fontWeight: '600' },
  responseText: { fontSize: 14, lineHeight: 22 },
  examplesBox: { marginTop: 12 },
  examplesTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  exampleText: { fontSize: 13, marginBottom: 4 },
  quizBox: { marginTop: 16, padding: 16, borderRadius: 12 },
  quizTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  quizMeta: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  quizMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  quizMetaText: { fontSize: 13 },
  questionCard: { marginBottom: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  questionText: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  optionButton: { padding: 12, borderRadius: 8, marginBottom: 8 },
  optionText: { fontSize: 14 },
  courseCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12, gap: 12 },
  courseIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  courseInfo: { flex: 1 },
  courseName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  courseMeta: { fontSize: 12 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 11 },
});