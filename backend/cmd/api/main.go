package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"backend/internal/database"
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/models"
	"backend/internal/redis"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_SSLMODE"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	log.Println("Connected to PostgreSQL")

	if err := database.AutoMigrate(db); err != nil {
		log.Fatal("Migration failed:", err)
	}
	log.Println("Database migration completed")

	redisClient, err := redis.NewClient()
	if err != nil {
		log.Fatal("Failed to connect to Redis:", err)
	}
	log.Println("Connected to Redis")

	seedDatabase(db)

	app := fiber.New()
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000",
		AllowCredentials: true,
	}))

	authHandler := handlers.NewAuthHandler(db, redisClient)
	courseHandler := handlers.NewCourseHandler(db)

	api := app.Group("/api")

	// Публичные маршруты
	api.Post("/auth/register", authHandler.Register)
	api.Post("/auth/login", authHandler.Login)

	// Защищённые маршруты
	protected := api.Group("/", middleware.AuthRequired())
	protected.Get("/auth/me", authHandler.Me)
	protected.Get("/courses/my", courseHandler.GetMyCourses)
	protected.Get("/courses", courseHandler.GetAllCourses)
	protected.Get("/courses/:id", courseHandler.GetCourse)
	protected.Get("/courses/:id/lessons/:lessonId", courseHandler.GetLesson)
	protected.Post("/courses/:id/activate", courseHandler.ActivateWithCode) // ← новый маршрут

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}
	log.Fatal(app.Listen(":" + port))
}

func seedDatabase(db *gorm.DB) {
	var courseCount int64
	db.Model(&models.Course{}).Count(&courseCount)
	if courseCount > 0 {
		return
	}

	course := models.Course{
		Title:       "Психология общения",
		Description: "Курс посвящён основам эффективной коммуникации, невербальным сигналам и управлению конфликтами.",
		Price:       0,
		IsPublished: true,
		ImageURL:    "https://placehold.co/600x400",
		AccessCode:  "DEV2026",
	}
	if err := db.Create(&course).Error; err != nil {
		log.Println("Failed to create seed course:", err)
		return
	}

	lessons := []models.Lesson{
		{CourseID: course.ID, Title: "Введение в психологию общения", Content: "Коммуникация — это основа человеческого взаимодействия...", Order: 1},
		{CourseID: course.ID, Title: "Невербальная коммуникация", Content: "Жесты, мимика, поза — всё это говорит больше, чем слова...", Order: 2},
		{CourseID: course.ID, Title: "Активное слушание", Content: "Умение слушать — важнейший навык в общении...", Order: 3},
	}
	for _, l := range lessons {
		if err := db.Create(&l).Error; err != nil {
			log.Println("Failed to create seed lesson:", err)
		}
	}

	var user models.User
	if err := db.First(&user).Error; err == nil {
		userCourse := models.UserCourse{
			UserID:   user.ID,
			CourseID: course.ID,
		}
		if err := db.Create(&userCourse).Error; err != nil {
			log.Println("Failed to enroll first user in course:", err)
		} else {
			log.Printf("Test course '%s' assigned to user %s %s\n", course.Title, user.FirstName, user.LastName)
		}
	} else {
		log.Println("No users found, skipping course enrollment")
	}
}
