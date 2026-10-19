<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\Approval;
use App\Models\AwardedBadge;
use App\Models\Badge;
use App\Models\BadgeCategory;
use App\Models\BadgeRequirement;
use App\Models\CalendarEvent;
use App\Models\ForumPost;
use App\Models\ForumTopic;
use App\Models\Notification;
use App\Models\Program;
use App\Models\SiteSetting;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * First-run demo data, ported from the original src/db/seed.ts.
 *
 * Idempotent: if any user already exists the seeder does nothing, matching the
 * original "seed once per fresh database" behaviour.
 */
class BspSeeder extends Seeder
{
    public function run(): void
    {
        if (User::query()->exists()) {
            return;
        }

        $passwordHash = Hash::make('laginghanda');

        $users = $this->createUsers($passwordHash);
        $this->createSettings();
        $programs = $this->createPrograms();
        $categories = $this->createCategories();
        $badges = $this->createBadges($programs, $categories);
        $requirements = $this->createRequirements($badges);

        $this->createSubmissions($users, $badges, $requirements);
        $this->createAnnouncements($users, $programs);
        $this->createForums($users, $programs);
        $this->createNotifications($users, $badges);
        $this->createCalendarEvents($programs);
    }

    /**
     * @return array<string, User>
     */
    private function createUsers(string $passwordHash): array
    {
        $definitions = [
            ['Ramon Delos Reyes', 'admin@bsp.org.ph', User::ROLE_ADMIN, '#1b4332', 'Council Executive. I review and approve advancement for the whole council.'],
            ['Miguel Tan', 'miguel@bsp.org.ph', User::ROLE_TEACHER, '#2d6a4f', 'Scout Leader for outdoor skills — knots, pioneering, and campcraft.'],
            ['Rosario Lim', 'rosario@bsp.org.ph', User::ROLE_TEACHER, '#40916c', 'Scout Leader for safety — first aid and emergency response.'],
            ['Ernesto Cruz', 'ernesto@bsp.org.ph', User::ROLE_TEACHER, '#bc6c25', 'Scout Leader for citizenship and leadership — service and the Scout Law.'],
            ['Lucia Fernandez', 'lucia@bsp.org.ph', User::ROLE_TEACHER, '#7b6d8d', 'Scout Leader for signalling and Scout craft.'],
            ['Paolo Reyes', 'paolo@bsp.org.ph', User::ROLE_STUDENT, '#52b788', 'Boy Scout working on his Membership Rank.'],
            ['Ana Villanueva', 'ana@bsp.org.ph', User::ROLE_STUDENT, '#74c69d', 'Boy Scout who loves first aid drills and long hikes.'],
            ['Kian Dalisay', 'kian@bsp.org.ph', User::ROLE_STUDENT, '#95d5b2', 'Boy Scout who always asks one more question about the outdoors.'],
            ['Bea Santiago', 'bea@bsp.org.ph', User::ROLE_STUDENT, '#d4a373', 'Senior Scout and writer of campfire stories.'],
            ['Ella Marquez', 'ella@bsp.org.ph', User::ROLE_STUDENT, '#c9a227', 'KID Scout with a watercolor hobby and a love for nature.'],
            ['Omar Haddad', 'omar@bsp.org.ph', User::ROLE_STUDENT, '#6b705c', 'Boy Scout who shines during knot-tying drills.'],
            ['Jasmine Ocampo', 'jasmine@bsp.org.ph', User::ROLE_STUDENT, '#f4a261', 'KID Scout who loves songs and storytelling.'],
            ['Noel Aquino', 'noel@bsp.org.ph', User::ROLE_STUDENT, '#2a6f97', 'Senior Scout who is always the first to volunteer.'],
            ['Tala Bautista', 'tala@bsp.org.ph', User::ROLE_STUDENT, '#bc4749', 'Boy Scout with a steady hand for first aid.'],
            ['Ivan Soriano', 'ivan@bsp.org.ph', User::ROLE_STUDENT, '#40916c', 'Senior Scout who never misses a hike.'],
        ];

        $byEmail = [];

        foreach ($definitions as [$name, $email, $role, $color, $bio]) {
            $byEmail[$email] = User::create([
                'name' => $name,
                'email' => $email,
                'password_hash' => $passwordHash,
                'role' => $role,
                'avatar_color' => $color,
                'bio' => $bio,
            ]);
        }

        return $byEmail;
    }

    private function createSettings(): void
    {
        $settings = [
            'siteName' => 'Boy Scouts of the Philippines',
            'tagline' => 'Laging Handa — Always Prepared',
            'theme' => 'forest',
            'allowRegistration' => 'true',
            'welcomeMessage' => 'Welcome to the Boy Scouts of the Philippines Advancement Portal. Join a program, climb the ranks in order, and earn merit badges. Every task is submitted with your proof and confirmed by your Scout Leader and the Council.',
            'maintenanceMode' => 'false',
            'supportEmail' => 'support@bsp.org.ph',
            'mascotName' => 'Handa',
            'logoUrl' => '',
            'faviconUrl' => '/images/logo.svg',
        ];

        foreach ($settings as $key => $value) {
            SiteSetting::create(['key' => $key, 'value' => $value]);
        }
    }

    /**
     * @return array<string, Program>
     */
    private function createPrograms(): array
    {
        $definitions = [
            ['KID Scout Program', 'kid-scouts', 'Kabataang Imumulat sa Diwa ng Scouting', '6-9 years', 'The first steps in Scouting — songs, games, and simple promises for our youngest members.', '#52b788', '🌱', 0],
            ['Boy Scout Program', 'boy-scouts', 'Boy Scout Program', '10-12 years', 'The core Scouting program. Earn the Membership Rank first, then climb the ranks — Tenderfoot, Second Class, and First Class — collecting merit badges along the way.', '#2d6a4f', '⚜️', 1],
            ['Senior Scout Program', 'senior-scouts', 'Senior Scout Program', '13-16 years', 'For older Scouts: leadership, signalling, service, and advanced outdoor skills.', '#1d4e89', '🧭', 2],
        ];

        $bySlug = [];

        foreach ($definitions as [$name, $slug, $section, $ageRange, $description, $color, $icon, $position]) {
            $bySlug[$slug] = Program::create([
                'name' => $name,
                'slug' => $slug,
                'section' => $section,
                'age_range' => $ageRange,
                'description' => $description,
                'color' => $color,
                'icon' => $icon,
                'position' => $position,
            ]);
        }

        return $bySlug;
    }

    /**
     * @return array<string, BadgeCategory>
     */
    private function createCategories(): array
    {
        $definitions = [
            ['Scout Ideals', 'scout-ideals', 'The Oath, the Law, and the promise of a Scout.', '#2d6a4f', '⚜️', 0],
            ['Outdoor Skills', 'outdoor-skills', 'Campcraft, knots, pioneering, and life in the open.', '#40916c', '🏕️', 1],
            ['Safety & First Aid', 'safety-first-aid', 'Be prepared to help in an emergency.', '#bc4749', '⛑️', 2],
            ['Citizenship & Leadership', 'citizenship-leadership', 'Duty to country, service to others, and leading a patrol.', '#1d4e89', '🇵🇭', 3],
            ['Scout Craft & Signalling', 'scout-craft', 'Messages, observation, and outdoor know-how.', '#2a6f97', '🧭', 4],
        ];

        $bySlug = [];

        foreach ($definitions as [$name, $slug, $description, $color, $icon, $position]) {
            $bySlug[$slug] = BadgeCategory::create([
                'name' => $name,
                'slug' => $slug,
                'description' => $description,
                'color' => $color,
                'icon' => $icon,
                'position' => $position,
            ]);
        }

        return $bySlug;
    }

    /**
     * @param  array<string, Program>  $programs
     * @param  array<string, BadgeCategory>  $categories
     * @return array<string, Badge>
     */
    private function createBadges(array $programs, array $categories): array
    {
        $definitions = [
            ['boy-scouts', 'scout-ideals', 'rank', 'boy-membership', 'Membership Rank', 'The first rank of the Boy Scout Program. Show your love of country and your promise to the movement.', '/images/badges/membership-badge.svg', true, 0],
            ['boy-scouts', 'scout-ideals', 'rank', 'boy-tenderfoot', 'Tenderfoot Scout Rank', 'The first step after the Membership Rank — a Scout learning the basics of the outdoors and the movement.', '/images/badges/tenderfoot-scout.svg', false, 1],
            ['boy-scouts', 'outdoor-skills', 'rank', 'boy-second-class', 'Second Class Scout Rank', 'A Scout who can camp, cook, and care for the outdoors.', '/images/badges/second-class-scout.svg', false, 2],
            ['boy-scouts', 'outdoor-skills', 'rank', 'boy-first-class', 'First Class Scout Rank', 'A confident outdoorsman who leads others on the trail.', '/images/badges/first-class-scout.svg', false, 3],
            ['boy-scouts', 'safety-first-aid', 'merit', 'merit-first-aid', 'First Aid', 'Be prepared to help in an emergency.', '/images/badges/first-aid.svg', false, 10],
            ['boy-scouts', 'outdoor-skills', 'merit', 'merit-knot-tying', 'Knot Tying and Pioneering', 'Ropes, knots, and camp gadgets.', '/images/badges/knot-tying.svg', false, 11],
            ['boy-scouts', 'outdoor-skills', 'merit', 'merit-campcraft', 'Campcraft', 'Live well and safely in the outdoors.', '/images/badges/campcraft.svg', false, 12],
            ['boy-scouts', 'citizenship-leadership', 'merit', 'merit-citizenship', 'Citizenship', 'Know your country and serve your community.', '/images/badges/citizenship.svg', false, 13],

            ['kid-scouts', 'scout-ideals', 'rank', 'kid-membership', 'Membership Rank', 'The KID Scout welcome rank.', '/images/badges/kid-membership.svg', true, 0],
            ['kid-scouts', 'scout-ideals', 'rank', 'kid-scout-rank', 'KID Scout Rank', 'A young Scout who knows the promise and loves the outdoors.', '/images/badges/kid-scout.svg', false, 1],
            ['kid-scouts', 'outdoor-skills', 'merit', 'merit-nature-study', 'Nature Study', 'Notice the world around you.', '/images/badges/nature-study.svg', false, 10],

            ['senior-scouts', 'scout-ideals', 'rank', 'senior-membership', 'Membership Rank', 'The Senior Scout welcome rank.', '/images/badges/senior-membership.svg', true, 0],
            ['senior-scouts', 'citizenship-leadership', 'rank', 'senior-scout-rank', 'Senior Scout Rank', 'A Scout who leads patrols and sets the example.', '/images/badges/senior-scout.svg', false, 1],
            ['senior-scouts', 'citizenship-leadership', 'rank', 'explorer-scout-rank', 'Explorer Scout Rank', 'A Scout who plans and carries out service that matters.', '/images/badges/explorer-scout.svg', false, 2],
            ['senior-scouts', 'citizenship-leadership', 'merit', 'merit-leadership', 'Leadership', 'Lead a patrol and plan an activity.', '/images/badges/leadership.svg', false, 10],
            ['senior-scouts', 'scout-craft', 'merit', 'merit-signalling', 'Signalling', 'Send messages without a phone.', '/images/badges/signalling.svg', false, 11],
            ['senior-scouts', 'citizenship-leadership', 'merit', 'merit-community-service', 'Community Service', 'Plan and carry out service that matters.', '/images/badges/community-service.svg', false, 12],
        ];

        $bySlug = [];

        foreach ($definitions as [$programSlug, $categorySlug, $kind, $slug, $name, $description, $image, $isMembership, $position]) {
            $bySlug[$slug] = Badge::create([
                'program_id' => $programs[$programSlug]->id,
                'category_id' => $categories[$categorySlug]->id,
                'kind' => $kind,
                'name' => $name,
                'slug' => $slug,
                'description' => $description,
                'image_url' => $image,
                'is_membership' => $isMembership,
                'position' => $position,
            ]);
        }

        return $bySlug;
    }

    /**
     * @param  array<string, Badge>  $badges
     * @return array<string, BadgeRequirement> keyed by requirement key
     */
    private function createRequirements(array $badges): array
    {
        $definitions = $this->requirementDefinitions();
        $byKey = [];

        foreach ($definitions as $definition) {
            $byKey[$definition['key']] = BadgeRequirement::create([
                'badge_id' => $badges[$definition['badge']]->id,
                'title' => $definition['title'],
                'description' => $definition['description'] ?? null,
                'instructions' => $definition['instructions'] ?? null,
                'type' => $definition['type'],
                'position' => $definition['position'],
                'requires_text' => $definition['requiresText'] ?? true,
                'requires_media' => $definition['requiresMedia'] ?? false,
                'media_kind' => $definition['mediaKind'] ?? 'video',
                'requires_link' => $definition['requiresLink'] ?? false,
                'quiz_json' => isset($definition['quiz']) ? json_encode($definition['quiz']) : null,
                'required_badge_id' => isset($definition['requiredBadge']) ? $badges[$definition['requiredBadge']]->id : null,
                'points' => $definition['points'] ?? 10,
            ]);
        }

        return $byKey;
    }

    /**
     * @param  array<string, User>  $users
     * @param  array<string, Badge>  $badges
     * @param  array<string, BadgeRequirement>  $requirements
     */
    private function createSubmissions(array $users, array $badges, array $requirements): void
    {
        $requirementBadge = [];
        foreach ($requirements as $key => $requirement) {
            $requirementBadge[$key] = $requirement->badge_id;
        }

        $approved = [
            ['paolo@bsp.org.ph', 'boy-membership.anthem', 'I sang Lupang Hinirang standing at attention with my patrol. Practice made it much easier.', '/images/badges/membership-badge.svg', 'image', null, null, 'miguel@bsp.org.ph', 'admin@bsp.org.ph'],
            ['paolo@bsp.org.ph', 'boy-membership.oath-quiz', "The Scout Law is a checklist for being a good person. For me, 'helpful' is the hardest and the most important.", null, null, '[2,0,0]', 100, 'miguel@bsp.org.ph', 'admin@bsp.org.ph'],
            ['kian@bsp.org.ph', 'merit-first-aid.three-ps', 'Check, Call, Care. I remembered it by saying it out loud before each drill.', null, null, '[1,1]', 100, 'rosario@bsp.org.ph', 'admin@bsp.org.ph'],
            ['kian@bsp.org.ph', 'merit-first-aid.bandage', "I bandaged Ana's forearm, then checked her fingers for warmth and colour. Two fingers slid under the bandage, so the pressure was right.", '/images/badges/first-aid.svg', 'image', null, null, 'rosario@bsp.org.ph', 'admin@bsp.org.ph'],
            ['bea@bsp.org.ph', 'merit-nature-study.walk', 'On my walk I noticed a spider web with dew, a fallen nest, and tiny tracks by the creek.', '/images/badges/nature-study.svg', 'image', null, null, 'rosario@bsp.org.ph', 'admin@bsp.org.ph'],
        ];

        foreach ($approved as [$email, $key, $text, $mediaUrl, $mediaType, $quizJson, $quizScore, $level1By, $level2By]) {
            $submission = Submission::create([
                'user_id' => $users[$email]->id,
                'kind' => Submission::KIND_REQUIREMENT,
                'badge_id' => $requirementBadge[$key],
                'requirement_id' => $requirements[$key]->id,
                'text_content' => $text,
                'media_url' => $mediaUrl,
                'media_type' => $mediaType,
                'quiz_json' => $quizJson,
                'quiz_score' => $quizScore,
                'status' => Submission::STATUS_APPROVED,
                'levels_approved' => 2,
                'levels_required' => 2,
                'decided_at' => now(),
            ]);

            Approval::insert([
                ['submission_id' => $submission->id, 'approver_id' => $users[$level1By]->id, 'level' => 1, 'decision' => 'approved', 'comment' => 'Well done. Requirement met.'],
                ['submission_id' => $submission->id, 'approver_id' => $users[$level2By]->id, 'level' => 2, 'decision' => 'approved', 'comment' => 'Confirmed. Recorded for advancement.'],
            ]);
        }

        $level1 = [
            ['paolo@bsp.org.ph', 'boy-membership.flag-oath', 'I recited the Panunumpa ng Katapatan sa Watawat from memory.', '/images/badges/membership-badge.svg', 'image', null, 'miguel@bsp.org.ph'],
            ['ana@bsp.org.ph', 'merit-first-aid.three-ps', 'The three Ps help me stay calm. I will practise the bandaging next.', null, null, '[1,1]', 'rosario@bsp.org.ph'],
        ];

        foreach ($level1 as [$email, $key, $text, $mediaUrl, $mediaType, $quizJson, $level1By]) {
            $submission = Submission::create([
                'user_id' => $users[$email]->id,
                'kind' => Submission::KIND_REQUIREMENT,
                'badge_id' => $requirementBadge[$key],
                'requirement_id' => $requirements[$key]->id,
                'text_content' => $text,
                'media_url' => $mediaUrl,
                'media_type' => $mediaType,
                'quiz_json' => $quizJson,
                'quiz_score' => $quizJson ? 100 : null,
                'status' => Submission::STATUS_LEVEL1_APPROVED,
                'levels_approved' => 1,
                'levels_required' => 2,
            ]);

            Approval::create([
                'submission_id' => $submission->id,
                'approver_id' => $users[$level1By]->id,
                'level' => 1,
                'decision' => 'approved',
                'comment' => 'Checked by the unit. Forwarded to the council for confirmation.',
            ]);
        }

        $pending = [
            ['paolo@bsp.org.ph', 'boy-membership.panatang', 'I practised the Panatang Makabayan every morning this week.', '/images/badges/membership-badge.svg', 'image'],
            ['tala@bsp.org.ph', 'boy-membership.anthem', 'Here is my video singing Lupang Hinirang with my patrol.', '/images/badges/membership-badge.svg', 'image'],
            ['kian@bsp.org.ph', 'boy-tenderfoot.signs', 'I showed the Scout sign, salute, and handshake in the video.', '/images/badges/leadership.svg', 'image'],
            ['ivan@bsp.org.ph', 'merit-signalling.semaphore', 'I sent three words: CAMP, WATER, TIRED.', '/images/badges/signalling.svg', 'image'],
        ];

        foreach ($pending as [$email, $key, $text, $mediaUrl, $mediaType]) {
            Submission::create([
                'user_id' => $users[$email]->id,
                'kind' => Submission::KIND_REQUIREMENT,
                'badge_id' => $requirementBadge[$key],
                'requirement_id' => $requirements[$key]->id,
                'text_content' => $text,
                'media_url' => $mediaUrl,
                'media_type' => $mediaType,
                'status' => Submission::STATUS_PENDING,
                'levels_approved' => 0,
                'levels_required' => 2,
            ]);
        }

        AwardedBadge::create([
            'user_id' => $users['bea@bsp.org.ph']->id,
            'badge_id' => $badges['merit-nature-study']->id,
        ]);
    }

    /**
     * @param  array<string, User>  $users
     * @param  array<string, Program>  $programs
     */
    private function createAnnouncements(array $users, array $programs): void
    {
        $definitions = [
            [null, 'admin@bsp.org.ph', 'Welcome to the BSP Advancement Portal ⚜️', 'Scouts — join a program, climb the ranks in order, and earn merit badges. Submit your proof and track your approvals. Laging Handa!', true],
            ['boy-scouts', 'miguel@bsp.org.ph', 'Membership Rank videos this meeting', 'Bring your recording ready: Lupang Hinirang, the Panunumpa ng Katapatan sa Watawat, and the Panatang Makabayan. We will record together.', false],
            ['boy-scouts', 'rosario@bsp.org.ph', 'First Aid merit badge drill day', 'We practise bandaging and splinting in pairs. The bandaging drill requirement needs a short video.', false],
            ['senior-scouts', 'ernesto@bsp.org.ph', 'Senior Scout service project', 'Start thinking about your Community Service merit badge. Bring one idea for a project that helps the barangay.', false],
        ];

        foreach ($definitions as [$programSlug, $authorEmail, $title, $body, $pinned]) {
            Announcement::create([
                'program_id' => $programSlug ? $programs[$programSlug]->id : null,
                'author_id' => $users[$authorEmail]->id,
                'title' => $title,
                'body' => $body,
                'pinned' => $pinned,
            ]);
        }
    }

    /**
     * @param  array<string, User>  $users
     * @param  array<string, Program>  $programs
     */
    private function createForums(array $users, array $programs): void
    {
        $membership = ForumTopic::create([
            'program_id' => $programs['boy-scouts']->id,
            'author_id' => $users['paolo@bsp.org.ph']->id,
            'title' => 'How do you memorise the Panatang Makabayan?',
        ]);
        $firstAid = ForumTopic::create([
            'program_id' => $programs['boy-scouts']->id,
            'author_id' => $users['tala@bsp.org.ph']->id,
            'title' => 'Bandage too tight? Ask here',
        ]);
        $lounge = ForumTopic::create([
            'program_id' => null,
            'author_id' => $users['bea@bsp.org.ph']->id,
            'title' => 'Campfire lounge: what rank are you working on?',
        ]);

        $posts = [
            [$membership, 'paolo@bsp.org.ph', 'I keep mixing up the middle lines. Any tricks?'],
            [$membership, 'miguel@bsp.org.ph', 'Say it out loud with the flag in front of you, three times a day. Rhythm helps more than reading.'],
            [$membership, 'tala@bsp.org.ph', 'I record myself and listen back. It is easier to spot the line I drop.'],
            [$firstAid, 'tala@bsp.org.ph', 'How do I know the bandage is snug but not too tight?'],
            [$firstAid, 'rosario@bsp.org.ph', 'Slide two fingers under it. If they fit comfortably, the pressure is right. Always re-check the fingers.'],
            [$lounge, 'bea@bsp.org.ph', 'I am on the Senior Scout Rank now. Leadership next.'],
            [$lounge, 'ivan@bsp.org.ph', 'Signalling merit badge for me this week. Semaphore is harder than it looks.'],
        ];

        foreach ($posts as [$topic, $authorEmail, $body]) {
            ForumPost::create([
                'topic_id' => $topic->id,
                'author_id' => $users[$authorEmail]->id,
                'body' => $body,
            ]);
        }
    }

    /**
     * @param  array<string, User>  $users
     * @param  array<string, Badge>  $badges
     */
    private function createNotifications(array $users, array $badges): void
    {
        $definitions = [
            ['paolo@bsp.org.ph', 'Membership Rank in progress', 'Your Lupang Hinirang video was approved. Submit the Panunumpa ng Katapatan sa Watawat next.', '/advancement/badge/'.$badges['boy-membership']->id],
            ['miguel@bsp.org.ph', 'Approvals waiting', 'Submissions are waiting for unit (level 1) approval.', '/approvals'],
            ['admin@bsp.org.ph', 'Council approvals waiting', 'Submissions are waiting for council (level 2) confirmation.', '/approvals'],
            ['bea@bsp.org.ph', 'Nature Study merit badge awarded ⚜️', 'The badge is on your sash. On to the Senior Scout Rank!', '/advancement'],
        ];

        foreach ($definitions as [$email, $title, $body, $href]) {
            Notification::create([
                'user_id' => $users[$email]->id,
                'title' => $title,
                'body' => $body,
                'href' => $href,
            ]);
        }
    }

    /**
     * @param  array<string, Program>  $programs
     */
    private function createCalendarEvents(array $programs): void
    {
        $definitions = [
            [null, 'Council Jamboree & camporee', 'Troops from every district gather for games, skills, and a big campfire.', 4, 'event'],
            ['boy-scouts', 'Membership Rank recording day', 'Bring your videos for the anthem and pledges.', 2, 'event'],
            ['boy-scouts', 'First aid demo day', 'Patrols show a two-minute bandaging drill.', 6, 'event'],
            [null, 'Tree Planting Day', 'Optional half-day tree planting in the community.', 9, 'holiday'],
        ];

        foreach ($definitions as [$programSlug, $title, $description, $daysFromNow, $type]) {
            CalendarEvent::create([
                'program_id' => $programSlug ? $programs[$programSlug]->id : null,
                'title' => $title,
                'description' => $description,
                'start_at' => now()->addDays($daysFromNow),
                'type' => $type,
            ]);
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function requirementDefinitions(): array
    {
        return [
            ['key' => 'boy-membership.anthem', 'badge' => 'boy-membership', 'title' => 'Sing the Philippine National Anthem (Lupang Hinirang)', 'type' => 'recite', 'position' => 0, 'description' => 'Show your love of country.', 'instructions' => "Stand at attention, sing Lupang Hinirang with proper bearing, and record yourself on video.\n\nUpload the video of your performance, then submit it for approval.", 'requiresText' => true, 'requiresMedia' => true, 'mediaKind' => 'video', 'points' => 15],
            ['key' => 'boy-membership.flag-oath', 'badge' => 'boy-membership', 'title' => 'Recite the Panunumpa ng Katapatan sa Watawat', 'type' => 'recite', 'position' => 1, 'description' => 'The Oath of Allegiance to the Flag.', 'instructions' => 'Recite the Panunumpa ng Katapatan sa Watawat from memory. Record a video of your recitation.', 'requiresText' => true, 'requiresMedia' => true, 'mediaKind' => 'video', 'points' => 15],
            ['key' => 'boy-membership.panatang', 'badge' => 'boy-membership', 'title' => 'Recite the Panatang Makabayan', 'type' => 'recite', 'position' => 2, 'description' => 'The Patriotic Pledge.', 'instructions' => 'Recite the Panatang Makabayan from memory. Record a video of your recitation.', 'requiresText' => true, 'requiresMedia' => true, 'mediaKind' => 'video', 'points' => 15],
            ['key' => 'boy-membership.oath-quiz', 'badge' => 'boy-membership', 'title' => 'Scout Oath and Law check', 'type' => 'quiz', 'position' => 3, 'description' => 'Answer the questions, then explain what the Law means to you.', 'instructions' => 'Answer the questions below, then write a short reflection in your own words.', 'requiresText' => true, 'quiz' => [
                ['q' => 'How many points does the Scout Law have?', 'options' => ['Eight', 'Ten', 'Twelve', 'Twenty'], 'answer' => 2],
                ['q' => 'The BSP motto is…', 'options' => ['Laging Handa', 'Bahala na', 'Kanya-kanya', 'Never mind'], 'answer' => 0],
                ['q' => 'A Scout is trustworthy. Which point of the Law is this?', 'options' => ['First', 'Third', 'Fifth', 'Twelfth'], 'answer' => 0],
            ], 'points' => 10],

            ['key' => 'boy-tenderfoot.signs', 'badge' => 'boy-tenderfoot', 'title' => 'Demonstrate the Scout sign, salute, and handshake', 'type' => 'task', 'position' => 0, 'description' => 'Show the three Scout gestures correctly.', 'instructions' => 'Record a short video showing the Scout sign, the Scout salute, and the Scout handshake.', 'requiresText' => true, 'requiresMedia' => true, 'mediaKind' => 'video', 'points' => 10],
            ['key' => 'boy-tenderfoot.knot-quiz', 'badge' => 'boy-tenderfoot', 'title' => 'Knot knowledge check', 'type' => 'quiz', 'position' => 1, 'description' => 'Know your basic knots.', 'requiresText' => false, 'quiz' => [
                ['q' => 'Which knot joins two ropes of different thickness?', 'options' => ['Square knot', 'Sheet bend', 'Clove hitch', 'Overhand'], 'answer' => 1],
                ['q' => 'A square knot joins…', 'options' => ['Two ropes of equal thickness', 'A rope to a pole', 'Two ropes of different thickness', 'Nothing'], 'answer' => 0],
            ], 'points' => 10],
            ['key' => 'boy-tenderfoot.first-aid-mb', 'badge' => 'boy-tenderfoot', 'title' => 'Earn the First Aid merit badge', 'type' => 'merit', 'position' => 2, 'description' => 'A Scout must be prepared to help.', 'requiredBadge' => 'merit-first-aid', 'points' => 20],

            ['key' => 'boy-second-class.campcraft-mb', 'badge' => 'boy-second-class', 'title' => 'Earn the Campcraft merit badge', 'type' => 'merit', 'position' => 0, 'description' => 'Live well in the outdoors.', 'requiredBadge' => 'merit-campcraft', 'points' => 20],
            ['key' => 'boy-second-class.fire', 'badge' => 'boy-second-class', 'title' => 'Campfire safety plan', 'type' => 'task', 'position' => 1, 'description' => 'Safety before sparks.', 'instructions' => 'Write your campfire safety plan: siting, clearing, water on hand, and how you will put it out cold.', 'requiresText' => true, 'points' => 15],
            ['key' => 'boy-second-class.citizenship-mb', 'badge' => 'boy-second-class', 'title' => 'Earn the Citizenship merit badge', 'type' => 'merit', 'position' => 2, 'description' => 'Know your country and serve your community.', 'requiredBadge' => 'merit-citizenship', 'points' => 20],

            ['key' => 'boy-first-class.knot-mb', 'badge' => 'boy-first-class', 'title' => 'Earn the Knot Tying and Pioneering merit badge', 'type' => 'merit', 'position' => 0, 'description' => 'Master ropes and lashings.', 'requiredBadge' => 'merit-knot-tying', 'points' => 20],
            ['key' => 'boy-first-class.patrol-lead', 'badge' => 'boy-first-class', 'title' => 'Plan and lead a patrol activity', 'type' => 'task', 'position' => 1, 'description' => 'Lead by example.', 'instructions' => 'Plan a short patrol activity, lead it, and summarise what you learned. Attach your activity plan from Google Drive if you have one.', 'requiresText' => true, 'requiresLink' => true, 'points' => 20],

            ['key' => 'kid-membership.anthem', 'badge' => 'kid-membership', 'title' => 'Sing the Philippine National Anthem (Lupang Hinirang)', 'type' => 'recite', 'position' => 0, 'description' => 'Our national anthem.', 'instructions' => 'Sing Lupang Hinirang with your patrol and record it.', 'requiresText' => true, 'requiresMedia' => true, 'mediaKind' => 'video', 'points' => 10],
            ['key' => 'kid-membership.panatang', 'badge' => 'kid-membership', 'title' => 'Recite the Panatang Makabayan', 'type' => 'recite', 'position' => 1, 'description' => 'Our patriotic pledge.', 'instructions' => 'Recite the Panatang Makabayan and record a video.', 'requiresText' => true, 'requiresMedia' => true, 'mediaKind' => 'video', 'points' => 10],
            ['key' => 'kid-scout-rank.nature-mb', 'badge' => 'kid-scout-rank', 'title' => 'Earn the Nature Study merit badge', 'type' => 'merit', 'position' => 0, 'description' => 'Notice the world around you.', 'requiredBadge' => 'merit-nature-study', 'points' => 15],

            ['key' => 'senior-membership.oath', 'badge' => 'senior-membership', 'title' => 'Recite the Scout Oath and Law', 'type' => 'recite', 'position' => 0, 'description' => 'The promise of a Scout.', 'instructions' => 'Recite the Scout Oath and the twelve points of the Scout Law from memory on video.', 'requiresText' => true, 'requiresMedia' => true, 'mediaKind' => 'video', 'points' => 15],
            ['key' => 'senior-membership.law-words', 'badge' => 'senior-membership', 'title' => 'Explain the Scout Law in your own words', 'type' => 'task', 'position' => 1, 'description' => 'Make it your own.', 'instructions' => 'Write what each point of the Scout Law means to you, with one example from your week.', 'requiresText' => true, 'points' => 15],
            ['key' => 'senior-scout-rank.leadership-mb', 'badge' => 'senior-scout-rank', 'title' => 'Earn the Leadership merit badge', 'type' => 'merit', 'position' => 0, 'description' => 'Lead by example.', 'requiredBadge' => 'merit-leadership', 'points' => 20],
            ['key' => 'senior-scout-rank.signalling-mb', 'badge' => 'senior-scout-rank', 'title' => 'Earn the Signalling merit badge', 'type' => 'merit', 'position' => 1, 'description' => 'Send messages without a phone.', 'requiredBadge' => 'merit-signalling', 'points' => 20],
            ['key' => 'explorer-scout-rank.service-mb', 'badge' => 'explorer-scout-rank', 'title' => 'Earn the Community Service merit badge', 'type' => 'merit', 'position' => 0, 'description' => 'Service is the Scout way.', 'requiredBadge' => 'merit-community-service', 'points' => 20],

            ['key' => 'merit-first-aid.three-ps', 'badge' => 'merit-first-aid', 'title' => 'The three Ps of first aid', 'type' => 'quiz', 'position' => 0, 'description' => 'Preserve life, Prevent further injury, Promote recovery.', 'requiresText' => false, 'quiz' => [
                ['q' => 'The three Ps are Preserve life, Prevent further injury, and…', 'options' => ['Provide snacks', 'Promote recovery', 'Pay attention', 'Practice more'], 'answer' => 1],
                ['q' => 'For a minor burn you should…', 'options' => ['Apply butter', 'Cool it with running water', 'Pop the blister', 'Toothpaste'], 'answer' => 1],
            ], 'points' => 10],
            ['key' => 'merit-first-aid.bandage', 'badge' => 'merit-first-aid', 'title' => 'Bandaging drill', 'type' => 'task', 'position' => 1, 'description' => 'Show a clean bandaging technique.', 'instructions' => 'Record a video of yourself bandaging a partner\'s forearm. Describe the steps you took.', 'requiresText' => true, 'requiresMedia' => true, 'mediaKind' => 'video', 'points' => 15],
            ['key' => 'merit-knot-tying.four-knots', 'badge' => 'merit-knot-tying', 'title' => 'Tie four basic knots', 'type' => 'task', 'position' => 0, 'description' => 'Square knot, sheet bend, clove hitch, and two half hitches.', 'instructions' => 'Tie each knot and record a short video, naming each one as you tie it.', 'requiresText' => true, 'requiresMedia' => true, 'mediaKind' => 'video', 'points' => 15],
            ['key' => 'merit-knot-tying.quiz', 'badge' => 'merit-knot-tying', 'title' => 'Knots quiz', 'type' => 'quiz', 'position' => 1, 'description' => 'Check your knot knowledge.', 'requiresText' => false, 'quiz' => [
                ['q' => 'Which knot is used to start a lashing?', 'options' => ['Clove hitch', 'Square knot', 'Sheet bend', 'Bowline'], 'answer' => 0],
            ], 'points' => 10],
            ['key' => 'merit-campcraft.tent', 'badge' => 'merit-campcraft', 'title' => 'Pitch and strike a tent', 'type' => 'task', 'position' => 0, 'description' => 'Set up a tent correctly.', 'instructions' => 'Record a video pitching your tent, then explain how you chose the ground and the direction.', 'requiresText' => true, 'requiresMedia' => true, 'mediaKind' => 'video', 'points' => 15],
            ['key' => 'merit-campcraft.fire', 'badge' => 'merit-campcraft', 'title' => 'Campfire safety plan', 'type' => 'task', 'position' => 1, 'description' => 'Safety before sparks.', 'instructions' => 'Write your campfire safety plan: siting, clearing, water on hand, and how you will put it out cold.', 'requiresText' => true, 'points' => 15],
            ['key' => 'merit-citizenship.flag', 'badge' => 'merit-citizenship', 'title' => 'Join a flag ceremony', 'type' => 'task', 'position' => 0, 'description' => 'Respect for the flag.', 'instructions' => 'Take part in a flag ceremony and upload a photo. Describe your role and what you felt.', 'requiresText' => true, 'requiresMedia' => true, 'mediaKind' => 'image', 'points' => 15],
            ['key' => 'merit-citizenship.rights', 'badge' => 'merit-citizenship', 'title' => 'Rights and responsibilities', 'type' => 'quiz', 'position' => 1, 'description' => 'Every right has a duty.', 'requiresText' => true, 'quiz' => [
                ['q' => 'Good community service begins with…', 'options' => ['Buying materials', 'Listening to the community', 'Taking photos', 'Choosing a title'], 'answer' => 1],
                ['q' => 'In the flag ceremony, the flag is lowered…', 'options' => ['At noon', 'At dusk', 'At dawn', 'Never'], 'answer' => 1],
            ], 'points' => 10],
            ['key' => 'merit-nature-study.walk', 'badge' => 'merit-nature-study', 'title' => 'Nature walk observation', 'type' => 'task', 'position' => 0, 'description' => 'Notice what others miss.', 'instructions' => 'Take a nature walk. Upload a photo of three things you noticed and write what you learned.', 'requiresText' => true, 'requiresMedia' => true, 'mediaKind' => 'image', 'points' => 15],
            ['key' => 'merit-leadership.lead', 'badge' => 'merit-leadership', 'title' => 'Lead a patrol activity', 'type' => 'task', 'position' => 0, 'description' => 'Lead by example.', 'instructions' => 'Plan and lead one patrol activity. Record a short video and describe how you shared the roles.', 'requiresText' => true, 'requiresMedia' => true, 'mediaKind' => 'video', 'points' => 20],
            ['key' => 'merit-signalling.semaphore', 'badge' => 'merit-signalling', 'title' => 'Send a message by semaphore', 'type' => 'task', 'position' => 0, 'description' => 'Send without a phone.', 'instructions' => 'Send three short words by semaphore or Morse. Record it and write the words you sent.', 'requiresText' => true, 'requiresMedia' => true, 'mediaKind' => 'video', 'points' => 15],
            ['key' => 'merit-community-service.plan', 'badge' => 'merit-community-service', 'title' => 'Plan a service project', 'type' => 'task', 'position' => 0, 'description' => 'Listen first, then act.', 'instructions' => 'Write your service plan: the need, who you will help, what you will do, and how you will measure success. Attach a document from Google Drive if you have one.', 'requiresText' => true, 'requiresLink' => true, 'points' => 20],
            ['key' => 'merit-community-service.report', 'badge' => 'merit-community-service', 'title' => 'Service report', 'type' => 'task', 'position' => 1, 'description' => 'Show what happened.', 'instructions' => 'Report on your service: photos and a short write-up of the outcome.', 'requiresText' => true, 'requiresMedia' => true, 'mediaKind' => 'image', 'points' => 20],
        ];
    }
}
