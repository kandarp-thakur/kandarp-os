/**
 * Shared CRUD configs — one definition per content collection, reused by every
 * route (list, entity, duplicate, bulk, reorder, archive, import/export).
 *
 * Centralizing the configs here means adding a new sub-route (e.g. `/bulk`)
 * is a one-liner that imports the config, instead of re-declaring it.
 */

import { createCrudConfig } from "@/lib/admin/crud";
import {
    awardSchema,
    blogPostSchema,
    certificateSchema,
    educationSchema,
    experienceSchema,
    infraNodeSchema,
    projectSchema,
    resumeSchema,
    serviceSchema,
    skillSchema,
    type Award,
    type BlogPost,
    type Certificate,
    type Education,
    type Experience,
    type InfraNode,
    type Project,
    type Resume,
    type Service,
    type Skill,
} from "@/lib/admin/types";

export const projectConfig = createCrudConfig<Project, typeof projectSchema>({
    collection: "projects",
    schema: projectSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "project",
});

export const blogConfig = createCrudConfig<BlogPost, typeof blogPostSchema>({
    collection: "blogPosts",
    schema: blogPostSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "blog",
});

export const experienceConfig = createCrudConfig<
    Experience,
    typeof experienceSchema
>({
    collection: "experience",
    schema: experienceSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "experience",
});

export const skillConfig = createCrudConfig<Skill, typeof skillSchema>({
    collection: "skills",
    schema: skillSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "skill",
});

export const infraConfig = createCrudConfig<InfraNode, typeof infraNodeSchema>({
    collection: "infraNodes",
    schema: infraNodeSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "infrastructure",
});

export const awardConfig = createCrudConfig<Award, typeof awardSchema>({
    collection: "awards",
    schema: awardSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "award",
});

export const educationConfig = createCrudConfig<
    Education,
    typeof educationSchema
>({
    collection: "education",
    schema: educationSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "education",
});

export const certificateConfig = createCrudConfig<
    Certificate,
    typeof certificateSchema
>({
    collection: "certificates",
    schema: certificateSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "certificate",
});

export const serviceConfig = createCrudConfig<Service, typeof serviceSchema>({
    collection: "services",
    schema: serviceSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "service",
});

export const resumeConfig = createCrudConfig<Resume, typeof resumeSchema>({
    collection: "resumes",
    schema: resumeSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "resume",
});
