<?php

namespace App\Livewire\Advancement;

use App\Models\BadgeRequirement;
use App\Models\Submission;
use App\Services\SubmissionService;
use Illuminate\Support\Str;
use Livewire\Component;
use Livewire\WithFileUploads;

/**
 * The requirement submission form: written answer, quiz, media proof and/or a
 * Drive link. Media is stored on the council server here; the Google Drive
 * uploader is wired up in phase 5.
 */
class RequirementForm extends Component
{
    use WithFileUploads;

    public int $requirementId;

    public string $textContent = '';

    /** @var array<int, int> quiz answers keyed by question index */
    public array $answers = [];

    public ?string $mediaUrl = null;

    public ?string $mediaType = null;

    public ?string $externalUrl = null;

    public ?string $driveFileId = null;

    public ?string $driveSharedWith = null;

    public string $storageProvider = 'server';

    /** @var mixed */
    public $upload = null;

    public ?string $error = null;

    public bool $ok = false;

    public ?array $questions = [];

    public bool $requiresText = true;

    public bool $requiresMedia = false;

    public string $mediaKind = 'video';

    public bool $requiresLink = false;

    public function mount(int $requirementId): void
    {
        $this->requirementId = $requirementId;

        $requirement = BadgeRequirement::query()->find($requirementId);
        if (! $requirement) {
            return;
        }

        $this->requiresText = (bool) $requirement->requires_text;
        $this->requiresMedia = (bool) $requirement->requires_media;
        $this->mediaKind = $requirement->media_kind ?: 'video';
        $this->requiresLink = (bool) $requirement->requires_link;
        $this->questions = json_decode($requirement->quiz_json ?? '[]', true) ?: [];

        $existing = Submission::query()
            ->where('user_id', auth()->id())
            ->where('requirement_id', $requirementId)
            ->first();

        if ($existing) {
            $this->textContent = (string) ($existing->text_content ?? '');
            $this->mediaUrl = $existing->media_url;
            $this->mediaType = $existing->media_type;
            $this->externalUrl = $existing->external_url;
            $this->driveFileId = $existing->drive_file_id;
            $this->driveSharedWith = $existing->drive_shared_with;
            $this->storageProvider = $existing->storage_provider ?: 'server';

            $answers = json_decode($existing->quiz_json ?? '[]', true);
            $this->answers = is_array($answers) ? $answers : [];
        }
    }

    public function removeAttachment(): void
    {
        $this->upload = null;
        $this->mediaUrl = null;
        $this->mediaType = null;
        $this->driveFileId = null;
        $this->driveSharedWith = null;
    }

    public function submit(SubmissionService $submissions): void
    {
        $this->error = null;
        $this->ok = false;

        if (count($this->questions) && count($this->answers) < count($this->questions)) {
            $this->error = 'Please answer every quiz question before submitting.';

            return;
        }

        if ($this->upload) {
            $this->validate([
                'upload' => 'file|max:40960|mimes:png,jpg,jpeg,webp,gif,mp4,webm,mov,ogg',
            ]);

            $mime = (string) $this->upload->getMimeType();
            $extension = strtolower((string) $this->upload->getClientOriginalExtension());
            $extension = preg_replace('/[^a-z0-9]/', '', $extension) ?: (str_starts_with($mime, 'video') ? 'mp4' : 'png');

            $filename = now()->format('YmdHis').'-'.Str::lower(Str::random(8)).'.'.$extension;
            $directory = public_path('uploads');
            if (! is_dir($directory)) {
                mkdir($directory, 0755, true);
            }
            $this->upload->move($directory, $filename);

            $this->mediaUrl = '/uploads/'.$filename;
            $this->mediaType = str_starts_with($mime, 'video') ? 'video' : 'image';
            $this->storageProvider = 'server';
            $this->driveFileId = null;
            $this->driveSharedWith = null;
            $this->upload = null;
        }

        $result = $submissions->submitRequirement(auth()->user(), $this->requirementId, [
            'textContent' => $this->textContent,
            'mediaUrl' => $this->mediaUrl,
            'mediaType' => $this->mediaType,
            'externalUrl' => $this->externalUrl,
            'driveFileId' => $this->driveFileId,
            'driveSharedWith' => $this->driveSharedWith,
            'storageProvider' => $this->storageProvider,
            'quiz' => $this->answers,
        ]);

        if (isset($result['error'])) {
            $this->error = $result['error'];

            return;
        }

        $this->ok = true;
        $this->dispatch('requirement-submitted');
    }

    public function render()
    {
        return view('livewire.advancement.requirement-form');
    }
}
