import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
      image: "https://lh3.googleusercontent.com/a/default-user=s96-c",
    },
  });

  console.log("Created test user:", user.email);

  // Create test courses
  const course1 = await prisma.course.upsert({
    where: { id: "course-1" },
    update: {},
    create: {
      id: "course-1",
      userId: user.id,
      playlistId: "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
      title: "Machine Learning",
      description:
        "Learn the fundamentals of machine learning including supervised and unsupervised learning.",
      channelName: "Stanford Online",
      thumbnail: "https://i.ytimg.com/vi/jGwO_UgTS7I/maxresdefault.jpg",
      videoCount: 6,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { id: "course-2" },
    update: {},
    create: {
      id: "course-2",
      userId: user.id,
      playlistId: "PLu0QiiEH40AZU5hXRPFkN-oM4xDHLCQiw",
      title: "Python for Everybody",
      description:
        "An introduction to Python programming for beginners. Learn the basics of Python and how to write programs.",
      channelName: "Coursera",
      thumbnail: "https://i.ytimg.com/vi/8DvO9r7QJFQ/maxresdefault.jpg",
      videoCount: 5,
    },
  });

  const course3 = await prisma.course.upsert({
    where: { id: "course-3" },
    update: {},
    create: {
      id: "course-3",
      userId: user.id,
      playlistId: "PLkdGijpH83KL2NYQXWF1z0Ci_7XmYM6vB",
      title: "React Fundamentals",
      description:
        "Master React and its core concepts. Build interactive web applications with React.",
      channelName: "Tech Education",
      thumbnail: "https://i.ytimg.com/vi/ysKClVrHfvU/maxresdefault.jpg",
      videoCount: 3,
    },
  });

  console.log("Created test courses");

  // Create test videos for course 1 (Machine Learning)
  const videos1 = [
    {
      id: "prog-1-1",
      courseId: course1.id,
      videoId: "jGwO_UgTS7I",
      title: "Introduction to Machine Learning",
      position: 0,
      duration: "52:47",
      thumbnail: "https://i.ytimg.com/vi/jGwO_UgTS7I/mqdefault.jpg",
      watched: true,
    },
    {
      id: "prog-1-2",
      courseId: course1.id,
      videoId: "4b4MfhrZM5Y",
      title: "Linear Regression",
      position: 1,
      duration: "47:22",
      thumbnail: "https://i.ytimg.com/vi/4b4MfhrZM5Y/mqdefault.jpg",
      watched: true,
    },
    {
      id: "prog-1-3",
      courseId: course1.id,
      videoId: "UzwVb60JsQ0",
      title: "Logistic Regression",
      position: 2,
      duration: "44:17",
      thumbnail: "https://i.ytimg.com/vi/UzwVb60JsQ0/mqdefault.jpg",
      watched: true,
    },
    {
      id: "prog-1-4",
      courseId: course1.id,
      videoId: "F0c-1blxIiU",
      title: "Neural Networks",
      position: 3,
      duration: "55:03",
      thumbnail: "https://i.ytimg.com/vi/F0c-1blxIiU/mqdefault.jpg",
      watched: true,
    },
    {
      id: "prog-1-5",
      courseId: course1.id,
      videoId: "1ZwITQyulnM",
      title: "Support Vector Machines",
      position: 4,
      duration: "50:51",
      thumbnail: "https://i.ytimg.com/vi/1ZwITQyulnM/mqdefault.jpg",
      watched: false,
    },
    {
      id: "prog-1-6",
      courseId: course1.id,
      videoId: "3CC9-14HlqU",
      title: "Decision Trees",
      position: 5,
      duration: "43:15",
      thumbnail: "https://i.ytimg.com/vi/3CC9-14HlqU/mqdefault.jpg",
      watched: false,
    },
  ];

  for (const video of videos1) {
    await prisma.videoProgress.upsert({
      where: { id: video.id },
      update: {},
      create: video,
    });
  }

  // Create test videos for course 2 (Python)
  const videos2 = [
    {
      id: "prog-2-1",
      courseId: course2.id,
      videoId: "8DvO9r7QJFQ",
      title: "Why Program?",
      position: 0,
      duration: "13:31",
      thumbnail: "https://i.ytimg.com/vi/8DvO9r7QJFQ/mqdefault.jpg",
      watched: true,
    },
    {
      id: "prog-2-2",
      courseId: course2.id,
      videoId: "YoHwpAmqS1Y",
      title: "Installing Python",
      position: 1,
      duration: "7:54",
      thumbnail: "https://i.ytimg.com/vi/YoHwpAmqS1Y/mqdefault.jpg",
      watched: true,
    },
    {
      id: "prog-2-3",
      courseId: course2.id,
      videoId: "WcDkADJF3DA",
      title: "Variables and Expressions",
      position: 2,
      duration: "16:27",
      thumbnail: "https://i.ytimg.com/vi/WcDkADJF3DA/mqdefault.jpg",
      watched: true,
    },
    {
      id: "prog-2-4",
      courseId: course2.id,
      videoId: "1QX5ibFmMKE",
      title: "Conditional Execution",
      position: 3,
      duration: "18:21",
      thumbnail: "https://i.ytimg.com/vi/1QX5ibFmMKE/mqdefault.jpg",
      watched: true,
    },
    {
      id: "prog-2-5",
      courseId: course2.id,
      videoId: "W8KS-q-DCooY",
      title: "Functions",
      position: 4,
      duration: "19:45",
      thumbnail: "https://i.ytimg.com/vi/W8KS-q-DCooY/mqdefault.jpg",
      watched: false,
    },
  ];

  for (const video of videos2) {
    await prisma.videoProgress.upsert({
      where: { id: video.id },
      update: {},
      create: video,
    });
  }

  // Create test videos for course 3 (React)
  const videos3 = [
    {
      id: "prog-3-1",
      courseId: course3.id,
      videoId: "ysKClVrHfvU",
      title: "React Intro",
      position: 0,
      duration: "24:15",
      thumbnail: "https://i.ytimg.com/vi/ysKClVrHfvU/mqdefault.jpg",
      watched: true,
    },
    {
      id: "prog-3-2",
      courseId: course3.id,
      videoId: "dQw4w9WgXcQ",
      title: "JSX and Components",
      position: 1,
      duration: "31:42",
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      watched: true,
    },
    {
      id: "prog-3-3",
      courseId: course3.id,
      videoId: "W6NZfCO5tTE",
      title: "Props and State",
      position: 2,
      duration: "28:17",
      thumbnail: "https://i.ytimg.com/vi/W6NZfCO5tTE/mqdefault.jpg",
      watched: false,
    },
  ];

  for (const video of videos3) {
    await prisma.videoProgress.upsert({
      where: { id: video.id },
      update: {},
      create: video,
    });
  }

  // Create some test notes
  await prisma.note.create({
    data: {
      userId: user.id,
      courseId: course1.id,
      videoId: "jGwO_UgTS7I",
      text: "Key takeaway: Machine learning enables computers to learn patterns from data without explicit programming.",
      timestamp: 145,
    },
  });

  await prisma.note.create({
    data: {
      userId: user.id,
      courseId: course1.id,
      videoId: "jGwO_UgTS7I",
      text: "Remember to review the mathematical foundations before moving to neural networks.",
      timestamp: null,
    },
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
