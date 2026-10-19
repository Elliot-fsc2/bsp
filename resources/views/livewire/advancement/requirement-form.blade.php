<div class="space-y-5">
    @if (count($questions))
        <div class="space-y-3">
            @foreach ($questions as $index => $question)
                <fieldset class="rounded-2xl bg-white/80 p-4">
                    <legend class="font-extrabold">{{ $index + 1 }}. {{ $question['q'] }}</legend>
                    <div class="mt-2 space-y-1">
                        @foreach ($question['options'] as $optionIndex => $option)
                            <label class="flex items-center gap-2 text-sm">
                                <input type="radio" value="{{ $optionIndex }}" wire:model="answers.{{ $index }}">
                                {{ $option }}
                            </label>
                        @endforeach
                    </div>
                </fieldset>
            @endforeach
        </div>
    @endif

    @if ($requiresText)
        <label class="block">
            <span class="mb-1 block text-sm font-extrabold">{{ count($questions) ? 'Your explanation' : 'Your answer' }}</span>
            <textarea
                wire:model="textContent"
                rows="6"
                class="w-full rounded-2xl border border-[#cfe0cb] px-3 py-2"
                placeholder="Write your answer. The rich-text editor and Drive uploads arrive in phase 5."
            ></textarea>
        </label>
    @endif

    @if ($requiresMedia)
        <div class="space-y-3">
            <span class="block text-sm font-extrabold">{{ $mediaKind === 'video' ? 'Video proof' : 'Photo proof' }}</span>
            <input type="file" wire:model="upload" accept="{{ $mediaKind === 'video' ? 'video/*' : 'image/*' }}" class="block text-sm">
            <p class="text-xs font-bold text-[#52796f]">Max 40 MB. Stored on the council server — Google Drive arrives in phase 5.</p>

            @error('upload')
                <p class="rounded-2xl bg-[#ffe0e8] px-3 py-2 text-sm font-bold">{{ $message }}</p>
            @enderror

            <div wire:loading wire:target="upload" class="text-xs font-bold text-[#52796f]">Uploading…</div>

            @if ($mediaUrl)
                <div class="rounded-2xl bg-white/80 p-3">
                    <p class="mb-2 text-xs font-extrabold uppercase tracking-wide text-[#52796f]">Current attachment · council server</p>
                    <x-submission-responses :answer="[
                        'textContent' => null,
                        'mediaUrl' => $mediaUrl,
                        'mediaType' => $mediaType,
                        'externalUrl' => null,
                        'driveFileId' => null,
                        'driveUrl' => null,
                        'driveSharedWith' => null,
                        'storageProvider' => 'server',
                        'quizJson' => null,
                        'quizScore' => null,
                    ]" />
                    <button type="button" wire:click="removeAttachment" class="mt-2 text-xs font-extrabold text-[#c9184a]">Remove attachment</button>
                </div>
            @endif
        </div>
    @endif

    @if ($requiresLink)
        <label class="block">
            <span class="mb-1 block text-sm font-extrabold">Google Drive link</span>
            <input type="url" wire:model="externalUrl" placeholder="https://drive.google.com/…" class="w-full rounded-2xl border border-[#cfe0cb] px-3 py-2">
        </label>
    @endif

    @if ($error)
        <p class="rounded-2xl bg-[#ffe0e8] px-3 py-2 text-sm font-bold">{{ $error }}</p>
    @endif

    @if ($ok)
        <p class="rounded-2xl bg-[#d8f3dc] px-3 py-2 text-sm font-bold">Submitted! A Scout Leader will review it, then a Council Admin confirms it.</p>
    @endif

    <button type="button" wire:click="submit" wire:loading.attr="disabled" class="rounded-full bg-[#2d6a4f] px-5 py-3 text-sm font-bold text-white">
        <span wire:loading.remove wire:target="submit,upload">Submit for approval</span>
        <span wire:loading wire:target="submit,upload">Submitting…</span>
    </button>
</div>
