ALTER TABLE "settings" ADD COLUMN "hero" JSONB NOT NULL DEFAULT '{}';

-- Backfill installations that already have the Settings singleton. New
-- installations receive equivalent data from the idempotent application seed.
UPDATE "settings"
SET "hero" = jsonb_build_object(
    'eyebrow', 'kandarp@kandarp-os:~$',
    'bootBanner', 'Welcome to Kandarp OS',
    'bootStatus', 'Boot completed successfully.',
    'title', "owner_name",
    'subtitle', 'DevOps Engineer',
    'description', 'I build reliable cloud infrastructure, secure networks, automated deployment pipelines, and production-ready systems that keep teams shipping safely.',
    'stats', jsonb_build_array(
        jsonb_build_object('label', 'Cloud', 'value', 'AWS'),
        jsonb_build_object('label', 'Runtime', 'value', 'Docker'),
        jsonb_build_object('label', 'Automation', 'value', 'Python')
    ),
    'ctas', '[]'::jsonb,
    'socials', '[]'::jsonb,
    'terminal', jsonb_build_object(
        'roles', jsonb_build_array('DevOps Engineer', 'Cloud Engineer', 'Network Engineer'),
        'script', jsonb_build_array(
            jsonb_build_object('kind', 'command', 'text', 'whoami'),
            jsonb_build_object('kind', 'role'),
            jsonb_build_object('kind', 'command', 'text', 'cat skills.json'),
            jsonb_build_object('kind', 'output', 'text', '{ "cloud": ["AWS", "Docker"], "net": ["VLAN", "Pentest"], "code": ["Python", "Bash"] }'),
            jsonb_build_object('kind', 'command', 'text', './connect.sh'),
            jsonb_build_object('kind', 'output', 'text', 'Connection ready. Let''s build something.')
        ),
        'char', 60, 'pause', 300, 'read', 1500, 'roleDwell', 2500,
        'roleCycles', 2, 'loop', 3000, 'startDelay', 1100
    ),
    'visual', jsonb_build_object(
        'backgroundEnabled', true, 'particlesEnabled', true,
        'infinityLoopEnabled', true, 'threeEnabled', true
    )
)
WHERE "hero" = '{}'::jsonb;
