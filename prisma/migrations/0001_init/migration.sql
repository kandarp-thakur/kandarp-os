-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INVITED');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContainerStatus" AS ENUM ('RUNNING', 'EXITED', 'CREATED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE');

-- CreateEnum
CREATE TYPE "ExperienceStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SkillDomain" AS ENUM ('FRONTEND', 'BACKEND', 'DEVOPS', 'DATA', 'DESIGN');

-- CreateEnum
CREATE TYPE "SkillStatus" AS ENUM ('ACTIVE', 'IDLE', 'LEARNING');

-- CreateEnum
CREATE TYPE "InfraStatus" AS ENUM ('ACTIVE', 'STANDBY', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "AwardTier" AS ENUM ('LEGENDARY', 'EPIC', 'RARE', 'COMMON');

-- CreateEnum
CREATE TYPE "EducationStatus" AS ENUM ('ONGOING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AnalyticsType" AS ENUM ('PAGEVIEW', 'PROJECT_CLICK', 'GITHUB_CLICK', 'RESUME_DOWNLOAD', 'BLOG_READ', 'CONTACT_SUBMIT', 'SEARCH');

-- CreateEnum
CREATE TYPE "AnalyticsDevice" AS ENUM ('DESKTOP', 'MOBILE', 'TABLET');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('INFO', 'WARNING', 'ERROR', 'SUCCESS');

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT NOT NULL DEFAULT '',
    "totp_secret" TEXT,
    "totp_enabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "email_verified" TIMESTAMP(3),
    "verify_token" TEXT,
    "verify_token_exp" TIMESTAMP(3),
    "reset_token" TEXT,
    "reset_token_exp" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "failed_logins" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ip" TEXT NOT NULL DEFAULT '',
    "user_agent" TEXT NOT NULL DEFAULT '',
    "remember_me" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "long_description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnail" TEXT,
    "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cover_image" TEXT,
    "github_url" TEXT,
    "live_url" TEXT,
    "demo_url" TEXT,
    "architecture_diagram" TEXT,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "challenges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "solutions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "published_date" TEXT,
    "container_status" "ContainerStatus" NOT NULL DEFAULT 'CREATED',
    "status_detail" TEXT NOT NULL DEFAULT 'Created',
    "image" TEXT NOT NULL DEFAULT '',
    "created" TEXT,
    "ports" JSONB NOT NULL DEFAULT '[]',
    "metrics" JSONB NOT NULL DEFAULT '[]',
    "changelog" JSONB NOT NULL DEFAULT '[]',
    "links" JSONB NOT NULL DEFAULT '[]',
    "seo" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "archived_at" TIMESTAMP(3),
    "archived_by_id" TEXT,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "rich_text" TEXT NOT NULL DEFAULT '',
    "code_blocks" JSONB NOT NULL DEFAULT '[]',
    "mermaid" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT NOT NULL DEFAULT 'General',
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featured_image" TEXT,
    "cover_image" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published_date" TEXT,
    "scheduled_date" TEXT,
    "reading_time" INTEGER NOT NULL DEFAULT 0,
    "canonical_url" TEXT,
    "author_id" TEXT,
    "seo" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "archived_at" TIMESTAMP(3),
    "archived_by_id" TEXT,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experience" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "company_url" TEXT,
    "company_logo" TEXT,
    "employment_type" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "location" TEXT NOT NULL DEFAULT '',
    "start_date" TEXT NOT NULL,
    "end_date" TEXT,
    "current_company" BOOLEAN NOT NULL DEFAULT false,
    "status" "ExperienceStatus" NOT NULL DEFAULT 'COMPLETED',
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "image" TEXT NOT NULL DEFAULT '',
    "replicas" TEXT NOT NULL DEFAULT '1/1',
    "uptime" TEXT NOT NULL DEFAULT '',
    "links" JSONB NOT NULL DEFAULT '[]',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "archived_at" TIMESTAMP(3),
    "archived_by_id" TEXT,

    CONSTRAINT "experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbr" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL,
    "domain" "SkillDomain" NOT NULL DEFAULT 'DEVOPS',
    "category" TEXT NOT NULL DEFAULT 'General',
    "color" TEXT NOT NULL DEFAULT '#2496ED',
    "description" TEXT NOT NULL DEFAULT '',
    "status" "SkillStatus" NOT NULL DEFAULT 'ACTIVE',
    "tagline" TEXT NOT NULL DEFAULT '',
    "icon" TEXT,
    "level" INTEGER NOT NULL DEFAULT 80,
    "years" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "projects_using_skill" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "x" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "y" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "connections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "archived_at" TIMESTAMP(3),
    "archived_by_id" TEXT,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infra_nodes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'server',
    "color" TEXT NOT NULL DEFAULT '#22d3ee',
    "role" TEXT NOT NULL,
    "status" "InfraStatus" NOT NULL DEFAULT 'ACTIVE',
    "status_detail" TEXT NOT NULL DEFAULT 'Up',
    "x" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "y" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "description" TEXT NOT NULL,
    "stack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specs" JSONB NOT NULL DEFAULT '[]',
    "metrics" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "links" JSONB NOT NULL DEFAULT '[]',
    "connections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "archived_at" TIMESTAMP(3),
    "archived_by_id" TEXT,

    CONSTRAINT "infra_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infra_edges" (
    "id" TEXT NOT NULL,
    "from_id" TEXT NOT NULL,
    "to_id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "infra_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awards" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "tier" "AwardTier" NOT NULL DEFAULT 'COMMON',
    "date" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Award',
    "category" TEXT NOT NULL DEFAULT 'General',
    "image" TEXT,
    "certificate" TEXT,
    "link" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "archived_at" TIMESTAMP(3),
    "archived_by_id" TEXT,

    CONSTRAINT "awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education" (
    "id" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "field" TEXT NOT NULL DEFAULT '',
    "stream" TEXT NOT NULL DEFAULT '',
    "start_date" TEXT NOT NULL,
    "end_date" TEXT,
    "status" "EducationStatus" NOT NULL DEFAULT 'COMPLETED',
    "grade" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "logo" TEXT,
    "certificates" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "archived_at" TIMESTAMP(3),
    "archived_by_id" TEXT,

    CONSTRAINT "education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT '',
    "issue_date" TEXT NOT NULL,
    "expiry_date" TEXT,
    "credential_id" TEXT NOT NULL DEFAULT '',
    "credential_url" TEXT,
    "verification_url" TEXT,
    "image" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT NOT NULL DEFAULT '',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "archived_at" TIMESTAMP(3),
    "archived_by_id" TEXT,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Wrench',
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cta" JSONB NOT NULL DEFAULT '{}',
    "price" TEXT NOT NULL DEFAULT '',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "archived_at" TIMESTAMP(3),
    "archived_by_id" TEXT,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Resume',
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL DEFAULT 0,
    "mime_type" TEXT NOT NULL DEFAULT 'application/pdf',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "archived_at" TIMESTAMP(3),
    "archived_by_id" TEXT,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_blogs" (
    "project_id" TEXT NOT NULL,
    "blog_id" TEXT NOT NULL,

    CONSTRAINT "project_blogs_pkey" PRIMARY KEY ("project_id","blog_id")
);

-- CreateTable
CREATE TABLE "project_skills" (
    "project_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,

    CONSTRAINT "project_skills_pkey" PRIMARY KEY ("project_id","skill_id")
);

-- CreateTable
CREATE TABLE "project_experience" (
    "project_id" TEXT NOT NULL,
    "experience_id" TEXT NOT NULL,

    CONSTRAINT "project_experience_pkey" PRIMARY KEY ("project_id","experience_id")
);

-- CreateTable
CREATE TABLE "project_infra" (
    "project_id" TEXT NOT NULL,
    "infra_id" TEXT NOT NULL,

    CONSTRAINT "project_infra_pkey" PRIMARY KEY ("project_id","infra_id")
);

-- CreateTable
CREATE TABLE "blog_skills" (
    "blog_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,

    CONSTRAINT "blog_skills_pkey" PRIMARY KEY ("blog_id","skill_id")
);

-- CreateTable
CREATE TABLE "blog_infra" (
    "blog_id" TEXT NOT NULL,
    "infra_id" TEXT NOT NULL,

    CONSTRAINT "blog_infra_pkey" PRIMARY KEY ("blog_id","infra_id")
);

-- CreateTable
CREATE TABLE "skill_infra" (
    "skill_id" TEXT NOT NULL,
    "infra_id" TEXT NOT NULL,

    CONSTRAINT "skill_infra_pkey" PRIMARY KEY ("skill_id","infra_id")
);

-- CreateTable
CREATE TABLE "version_history" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "label" TEXT,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "saved_by_id" TEXT,

    CONSTRAINT "version_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "thumbnail" TEXT,
    "alt" TEXT NOT NULL DEFAULT '',
    "folder" TEXT NOT NULL DEFAULT '/',
    "width" INTEGER,
    "height" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "optimized" BOOLEAN NOT NULL DEFAULT false,
    "variants" JSONB NOT NULL DEFAULT '[]',
    "blur_data_url" TEXT NOT NULL DEFAULT '',
    "focalPoint" JSONB,
    "storage" TEXT NOT NULL DEFAULT 'local',
    "public_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "archived_at" TIMESTAMP(3),
    "archived_by_id" TEXT,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '#2496ED',
    "entity_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#64748b',
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "site_name" TEXT NOT NULL DEFAULT 'Kandarp OS',
    "owner_name" TEXT NOT NULL DEFAULT 'Kandarp Kumar Thakur',
    "logo" TEXT,
    "favicon" TEXT,
    "hero_portrait" TEXT,
    "hero_avatar" JSONB NOT NULL DEFAULT '{}',
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "contact" JSONB NOT NULL DEFAULT '{}',
    "socials" JSONB NOT NULL DEFAULT '[]',
    "brand" JSONB NOT NULL DEFAULT '{}',
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "typography" JSONB NOT NULL DEFAULT '{}',
    "colors" JSONB NOT NULL DEFAULT '{}',
    "navigation" JSONB NOT NULL DEFAULT '[]',
    "footer" JSONB NOT NULL DEFAULT '{}',
    "animations_enabled" BOOLEAN NOT NULL DEFAULT true,
    "performance_mode" TEXT NOT NULL DEFAULT 'auto',
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "maintenance_message" TEXT NOT NULL DEFAULT '',
    "global_seo" JSONB NOT NULL DEFAULT '{}',
    "api_keys" JSONB NOT NULL DEFAULT '[]',
    "environment_variables" JSONB NOT NULL DEFAULT '[]',
    "cache" JSONB NOT NULL DEFAULT '{}',
    "integrations" JSONB NOT NULL DEFAULT '[]',
    "custom_scripts" TEXT NOT NULL DEFAULT '',
    "custom_css" TEXT NOT NULL DEFAULT '',
    "custom_javascript" TEXT NOT NULL DEFAULT '',
    "notification_emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_customization" (
    "id" TEXT NOT NULL,
    "sections" JSONB NOT NULL DEFAULT '[]',
    "page" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_customization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "profile_image_id" TEXT,
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "github" TEXT,
    "linkedin" TEXT,
    "resume" TEXT NOT NULL DEFAULT '',
    "social_links" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "AnalyticsType" NOT NULL,
    "path" TEXT NOT NULL DEFAULT '',
    "referrer" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "device" "AnalyticsDevice" NOT NULL DEFAULT 'DESKTOP',
    "browser" TEXT NOT NULL DEFAULT '',
    "duration" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL DEFAULT '',
    "entity_id" TEXT NOT NULL DEFAULT '',
    "details" TEXT NOT NULL DEFAULT '',
    "level" "ActivityLevel" NOT NULL DEFAULT 'INFO',
    "ip" TEXT NOT NULL DEFAULT '',
    "user_agent" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_name_idx" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "permissions_name_idx" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "user_permissions_permission_id_idx" ON "user_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_user_id_permission_id_key" ON "user_permissions"("user_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_tokens_expires_idx" ON "verification_tokens"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_slug_idx" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_featured_idx" ON "projects"("featured");

-- CreateIndex
CREATE INDEX "projects_archived_at_idx" ON "projects"("archived_at");

-- CreateIndex
CREATE INDEX "projects_display_order_idx" ON "projects"("display_order");

-- CreateIndex
CREATE INDEX "projects_category_idx" ON "projects"("category");

-- CreateIndex
CREATE INDEX "projects_created_at_idx" ON "projects"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_status_idx" ON "blog_posts"("status");

-- CreateIndex
CREATE INDEX "blog_posts_featured_idx" ON "blog_posts"("featured");

-- CreateIndex
CREATE INDEX "blog_posts_archived_at_idx" ON "blog_posts"("archived_at");

-- CreateIndex
CREATE INDEX "blog_posts_category_idx" ON "blog_posts"("category");

-- CreateIndex
CREATE INDEX "blog_posts_created_at_idx" ON "blog_posts"("created_at");

-- CreateIndex
CREATE INDEX "experience_archived_at_idx" ON "experience"("archived_at");

-- CreateIndex
CREATE INDEX "experience_display_order_idx" ON "experience"("display_order");

-- CreateIndex
CREATE INDEX "experience_created_at_idx" ON "experience"("created_at");

-- CreateIndex
CREATE INDEX "experience_status_idx" ON "experience"("status");

-- CreateIndex
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

-- CreateIndex
CREATE INDEX "skills_slug_idx" ON "skills"("slug");

-- CreateIndex
CREATE INDEX "skills_domain_idx" ON "skills"("domain");

-- CreateIndex
CREATE INDEX "skills_status_idx" ON "skills"("status");

-- CreateIndex
CREATE INDEX "skills_featured_idx" ON "skills"("featured");

-- CreateIndex
CREATE INDEX "skills_archived_at_idx" ON "skills"("archived_at");

-- CreateIndex
CREATE INDEX "skills_display_order_idx" ON "skills"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "infra_nodes_slug_key" ON "infra_nodes"("slug");

-- CreateIndex
CREATE INDEX "infra_nodes_slug_idx" ON "infra_nodes"("slug");

-- CreateIndex
CREATE INDEX "infra_nodes_status_idx" ON "infra_nodes"("status");

-- CreateIndex
CREATE INDEX "infra_nodes_archived_at_idx" ON "infra_nodes"("archived_at");

-- CreateIndex
CREATE INDEX "infra_nodes_display_order_idx" ON "infra_nodes"("display_order");

-- CreateIndex
CREATE INDEX "infra_edges_from_id_idx" ON "infra_edges"("from_id");

-- CreateIndex
CREATE INDEX "infra_edges_to_id_idx" ON "infra_edges"("to_id");

-- CreateIndex
CREATE UNIQUE INDEX "infra_edges_from_id_to_id_key" ON "infra_edges"("from_id", "to_id");

-- CreateIndex
CREATE INDEX "awards_tier_idx" ON "awards"("tier");

-- CreateIndex
CREATE INDEX "awards_featured_idx" ON "awards"("featured");

-- CreateIndex
CREATE INDEX "awards_archived_at_idx" ON "awards"("archived_at");

-- CreateIndex
CREATE INDEX "awards_display_order_idx" ON "awards"("display_order");

-- CreateIndex
CREATE INDEX "education_status_idx" ON "education"("status");

-- CreateIndex
CREATE INDEX "education_archived_at_idx" ON "education"("archived_at");

-- CreateIndex
CREATE INDEX "education_display_order_idx" ON "education"("display_order");

-- CreateIndex
CREATE INDEX "certificates_issuer_idx" ON "certificates"("issuer");

-- CreateIndex
CREATE INDEX "certificates_archived_at_idx" ON "certificates"("archived_at");

-- CreateIndex
CREATE INDEX "certificates_display_order_idx" ON "certificates"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE INDEX "services_slug_idx" ON "services"("slug");

-- CreateIndex
CREATE INDEX "services_featured_idx" ON "services"("featured");

-- CreateIndex
CREATE INDEX "services_archived_at_idx" ON "services"("archived_at");

-- CreateIndex
CREATE INDEX "services_display_order_idx" ON "services"("display_order");

-- CreateIndex
CREATE INDEX "resumes_is_primary_idx" ON "resumes"("is_primary");

-- CreateIndex
CREATE INDEX "resumes_archived_at_idx" ON "resumes"("archived_at");

-- CreateIndex
CREATE INDEX "project_blogs_blog_id_idx" ON "project_blogs"("blog_id");

-- CreateIndex
CREATE INDEX "project_skills_skill_id_idx" ON "project_skills"("skill_id");

-- CreateIndex
CREATE INDEX "project_experience_experience_id_idx" ON "project_experience"("experience_id");

-- CreateIndex
CREATE INDEX "project_infra_infra_id_idx" ON "project_infra"("infra_id");

-- CreateIndex
CREATE INDEX "blog_skills_skill_id_idx" ON "blog_skills"("skill_id");

-- CreateIndex
CREATE INDEX "blog_infra_infra_id_idx" ON "blog_infra"("infra_id");

-- CreateIndex
CREATE INDEX "skill_infra_infra_id_idx" ON "skill_infra"("infra_id");

-- CreateIndex
CREATE INDEX "version_history_entity_type_entity_id_idx" ON "version_history"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "version_history_saved_at_idx" ON "version_history"("saved_at");

-- CreateIndex
CREATE INDEX "media_assets_mime_type_idx" ON "media_assets"("mime_type");

-- CreateIndex
CREATE INDEX "media_assets_folder_idx" ON "media_assets"("folder");

-- CreateIndex
CREATE INDEX "media_assets_archived_at_idx" ON "media_assets"("archived_at");

-- CreateIndex
CREATE INDEX "media_assets_created_at_idx" ON "media_assets"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "tags_slug_idx" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "tags_usage_count_idx" ON "tags"("usage_count");

-- CreateIndex
CREATE INDEX "analytics_events_type_idx" ON "analytics_events"("type");

-- CreateIndex
CREATE INDEX "analytics_events_timestamp_idx" ON "analytics_events"("timestamp");

-- CreateIndex
CREATE INDEX "analytics_events_path_idx" ON "analytics_events"("path");

-- CreateIndex
CREATE INDEX "analytics_events_country_idx" ON "analytics_events"("country");

-- CreateIndex
CREATE INDEX "analytics_events_device_idx" ON "analytics_events"("device");

-- CreateIndex
CREATE INDEX "analytics_events_browser_idx" ON "analytics_events"("browser");

-- CreateIndex
CREATE INDEX "activity_logs_timestamp_idx" ON "activity_logs"("timestamp");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_entity_idx" ON "activity_logs"("entity");

-- CreateIndex
CREATE INDEX "activity_logs_level_idx" ON "activity_logs"("level");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience" ADD CONSTRAINT "experience_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience" ADD CONSTRAINT "experience_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infra_nodes" ADD CONSTRAINT "infra_nodes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infra_nodes" ADD CONSTRAINT "infra_nodes_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infra_edges" ADD CONSTRAINT "infra_edges_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infra_edges" ADD CONSTRAINT "infra_edges_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awards" ADD CONSTRAINT "awards_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awards" ADD CONSTRAINT "awards_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education" ADD CONSTRAINT "education_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education" ADD CONSTRAINT "education_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_blogs" ADD CONSTRAINT "project_blogs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_blogs" ADD CONSTRAINT "project_blogs_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_experience" ADD CONSTRAINT "project_experience_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_experience" ADD CONSTRAINT "project_experience_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_infra" ADD CONSTRAINT "project_infra_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_infra" ADD CONSTRAINT "project_infra_infra_id_fkey" FOREIGN KEY ("infra_id") REFERENCES "infra_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_skills" ADD CONSTRAINT "blog_skills_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_skills" ADD CONSTRAINT "blog_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_infra" ADD CONSTRAINT "blog_infra_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_infra" ADD CONSTRAINT "blog_infra_infra_id_fkey" FOREIGN KEY ("infra_id") REFERENCES "infra_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_infra" ADD CONSTRAINT "skill_infra_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_infra" ADD CONSTRAINT "skill_infra_infra_id_fkey" FOREIGN KEY ("infra_id") REFERENCES "infra_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "version_history" ADD CONSTRAINT "version_history_saved_by_id_fkey" FOREIGN KEY ("saved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

