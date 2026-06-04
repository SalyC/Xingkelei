package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"backend/internal/database"
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/models"
	// "backend/internal/redis" // пока отключён
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Временная папка для аватаров (на Render разрешена)
	avatarDir := filepath.Join("/tmp", "uploads", "avatars")
	if err := os.MkdirAll(avatarDir, 0755); err != nil {
		log.Fatal("Failed to create avatar directory:", err)
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

	// Redis временно отключён
	// redisClient, err := redis.NewClient()
	// if err != nil {
	// 	log.Fatal("Failed to connect to Redis:", err)
	// }
	// log.Println("Connected to Redis")

	seedDatabase(db)

	// ========== Создание администратора по умолчанию ==========
	adminEmail := "GM_on_the_rakbot@gmail.com"
	adminPass := "test2026"
	adminFirst := "Alexander"
	adminLast := "Sadist"

	var adminUser models.User
	result := db.Where("email = ?", adminEmail).First(&adminUser)
	if result.Error != nil {
		// Пользователь не найден — создаём
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(adminPass), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Failed to hash admin password: %v", err)
		} else {
			adminUser = models.User{
				Email:     adminEmail,
				Password:  string(hashedPassword),
				FirstName: adminFirst,
				LastName:  adminLast,
				Role:      "admin",
			}
			db.Create(&adminUser)
			log.Printf("Admin user created: %s", adminEmail)
		}
	} else {
		// Пользователь существует — убедимся, что он админ
		if adminUser.Role != "admin" {
			adminUser.Role = "admin"
			db.Save(&adminUser)
			log.Printf("User %s promoted to admin", adminEmail)
		}
	}
	// =========================================================

	app := fiber.New()
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "https://xingkelei.vercel.app/",
		AllowCredentials: true,
	}))

	app.Static("/avatars", avatarDir)

	authHandler := handlers.NewAuthHandler(db, nil) // nil вместо Redis
	courseHandler := handlers.NewCourseHandler(db)
	lessonHandler := handlers.NewLessonHandler(db)
	adminHandler := handlers.NewAdminHandler(db)

	api := app.Group("/api")

	// Публичные маршруты
	api.Post("/auth/register", authHandler.Register)
	api.Post("/auth/login", authHandler.Login)
	api.Get("/public/courses/:id", courseHandler.GetPublicCourse)

	// Защищённые маршруты
	protected := api.Group("/", middleware.AuthRequired(db))

	// Профиль
	protected.Get("/auth/me", authHandler.Me)
	protected.Put("/auth/profile", authHandler.UpdateProfile)
	protected.Post("/auth/change-password", authHandler.ChangePassword)
	protected.Post("/auth/avatar", authHandler.UploadAvatar)

	// Курсы
	protected.Post("/courses/activate", courseHandler.ActivateByCode)
	protected.Get("/courses/my", courseHandler.GetMyCourses)
	protected.Get("/courses", courseHandler.GetAllCourses)
	protected.Get("/courses/:id", courseHandler.GetCourse)
	protected.Get("/courses/:id/lessons/:lessonId", courseHandler.GetLesson)
	protected.Post("/courses/:id/activate", courseHandler.ActivateWithCode)

	// Прогресс и сертификаты
	protected.Post("/courses/:courseId/lessons/:lessonId/complete", lessonHandler.CompleteLesson)
	protected.Get("/courses/:id/progress", lessonHandler.GetCourseProgress)
	protected.Post("/courses/:id/complete", lessonHandler.CompleteCourse)
	protected.Get("/certificates/my", lessonHandler.GetMyCertificates)

	// Админка (пользователи)
	protected.Get("/admin/users", middleware.AdminRequired(db), adminHandler.GetUsers)
	protected.Post("/admin/users/:id/toggle-block", middleware.AdminRequired(db), adminHandler.ToggleBlock)
	protected.Get("/admin/users/:id/courses", middleware.AdminRequired(db), adminHandler.GetUserCourses)
	protected.Put("/admin/users/:id/role", middleware.AdminRequired(db), adminHandler.UpdateUserRole)
	protected.Delete("/admin/users/:id", middleware.AdminRequired(db), adminHandler.DeleteUser)
	protected.Post("/admin/users/:id/ban", middleware.AdminRequired(db), adminHandler.BanUser)
	protected.Post("/admin/users/:id/unban", middleware.AdminRequired(db), adminHandler.UnbanUser)

	// Админка (контент)
	protected.Get("/admin/courses", middleware.AdminRequired(db), adminHandler.GetAllCoursesForAdmin)
	protected.Get("/admin/courses/:id/lessons", middleware.AdminRequired(db), adminHandler.GetLessonsForAdmin)
	protected.Put("/admin/lessons/:id", middleware.AdminRequired(db), adminHandler.UpdateLessonAdmin)

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

	courses := []models.Course{
		{
			Title:       "Управление финансами",
			Description: "Научитесь контролировать личный бюджет, инвестировать и достигать финансовых целей.",
			Price:       0,
			IsPublished: true,
			ImageURL:    "/javoronok.png",
			AccessCode:  "FINANCE2026",
		},
		{
			Title:       "Цена времени",
			Description: "Эффективный тайм-менеджмент, приоритизация и избавление от прокрастинации.",
			Price:       0,
			IsPublished: true,
			ImageURL:    "/finance.png",
			AccessCode:  "TIME2026",
		},
		{
			Title:       "Психология общения",
			Description: "Освойте навыки уверенного общения, разрешения конфликтов и публичных выступлений.",
			Price:       0,
			IsPublished: true,
			ImageURL:    "/psychology.png",
			AccessCode:  "PSYCHO2026",
		},
		{
			Title:       "Искусство коммуникации",
			Description: "Практические техники для повседневного и делового общения.",
			Price:       0,
			IsPublished: true,
			ImageURL:    "/timemanagement.png",
			AccessCode:  "TALK2026",
		},
	}

	videos := map[string][]string{
		"Управление финансами": {
			"https://www.youtube.com/watch?v=HO5bXcK8HX4",
			"https://www.youtube.com/watch?v=Wg3hY6BQj4A",
			"https://www.youtube.com/watch?v=9GrZYLQqDqA",
		},
		"Цена времени": {
			"https://www.youtube.com/watch?v=4Z9Mf2Gq4hY",
			"https://www.youtube.com/watch?v=XfGm8Hc9QyY",
			"https://www.youtube.com/watch?v=3JY8hJ9xGcE",
		},
		"Психология общения": {
			"https://www.youtube.com/watch?v=kJ3GXFkLqF8",
			"https://www.youtube.com/watch?v=Hs5gF1zJ4XM",
			"https://www.youtube.com/watch?v=V9fL7a5nDzM",
		},
		"Искусство коммуникации": {
			"https://www.youtube.com/watch?v=Zm3JqG8L5Vw",
			"https://www.youtube.com/watch?v=Nb4pG5mA8X4",
			"https://www.youtube.com/watch?v=Kq4eH9jZ7VY",
		},
	}

	lessonTitles := []string{"Введение", "Основной модуль", "Практика"}

	for _, course := range courses {
		if err := db.Create(&course).Error; err != nil {
			log.Printf("Failed to create course %s: %v", course.Title, err)
			continue
		}

		urls, ok := videos[course.Title]
		if !ok {
			urls = []string{"", "", ""}
		}

		for i, title := range lessonTitles {
			lesson := models.Lesson{
				CourseID: course.ID,
				Title:    title,
				Content:  "Текст урока...",
				VideoURL: urls[i],
				Order:    i + 1,
			}
			db.Create(&lesson)
		}
	}

	// Привязка первого пользователя к первому курсу (если есть)
	var user models.User
	if err := db.First(&user).Error; err == nil {
		var firstCourse models.Course
		if err := db.First(&firstCourse).Error; err == nil {
			db.Create(&models.UserCourse{UserID: user.ID, CourseID: firstCourse.ID})
		}
	}
}
