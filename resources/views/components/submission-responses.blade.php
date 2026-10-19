@props(['answer', 'questions' => [], 'compact' => false])

@php
    $a = is_array($answer) ? $answer : [
        'textContent' => $answer->text_content,
        'mediaUrl' => $answer->media_url,
        'mediaType' => $answer->media_type,
        'externalUrl' => $answer->external_url,
        'driveFileId' => $answer->drive_file_id,
        'driveUrl' => $answer->drive_url,
        'driveSharedWith' => $answer->drive_shared_with,
        'storageProvider' => $answer->storage_provider,
        'quizJson' => $answer->quiz_json,
        'quizScore' => $answer->quiz_score,
    ];

    $quizAnswers = json_decode($a['quizJson'] ?? '[]', true);
    $quizAnswers = is_array($quizAnswers) ? $quizAnswers : [];
    $driveId = $a['driveFileId'] ?? null;
    $driveLink = $a['driveUrl'] ?? ($driveId ? "https://drive.google.com/file/d/{$driveId}/view" : null);
    $isVideo = ($a['mediaType'] ?? null) === 'video';
    $mediaBox = $compact ? 'max-h-64' : 'max-h-[26rem]';
    $hasSomething = ! empty($a['textContent']) || ! empty($a['mediaUrl']) || ! empty($driveId) || ! empty($a['externalUrl']) || count($questions) > 0;
@endphp

@if (! $hasSomething)
    <p class="text-sm text-[#52796f]">No answer was attached to this task.</p>
@else
    <div class="space-y-3">
        @if ($driveId)
            <div>
                <p class="mb-1 text-xs font-extrabold uppercase tracking-wide text-[#52796f]">{{ $isVideo ? 'Video proof' : 'Photo proof' }} · Google Drive</p>
                @if ($isVideo)
                    <iframe src="https://drive.google.com/file/d/{{ $driveId }}/preview" class="aspect-video w-full rounded-xl" allow="autoplay" title="Submitted proof"></iframe>
                @else
                    <img src="https://drive.google.com/thumbnail?id={{ $driveId }}&sz=w1200" alt="Submitted proof" class="{{ $mediaBox }} rounded-xl bg-white">
                @endif
                @if ($driveLink)
                    <a href="{{ $driveLink }}" target="_blank" rel="noopener noreferrer" class="mt-2 inline-block text-sm font-extrabold text-[#1d4e89] underline">Open in Google Drive →</a>
                @endif
                @if (($a['driveSharedWith'] ?? null) === 'council')
                    <p class="mt-1 text-xs font-bold text-[#52796f]">Shared with the connected Scout Leader and Council Admin Google accounts.</p>
                @elseif (($a['driveSharedWith'] ?? null) === 'link')
                    <p class="mt-1 text-xs font-bold text-[#c9184a]">No reviewer had connected Google Drive yet, so this file is shared as an unlisted link.</p>
                @endif
            </div>
        @elseif (! empty($a['mediaUrl']))
            <div>
                <p class="mb-1 text-xs font-extrabold uppercase tracking-wide text-[#52796f]">{{ $isVideo ? 'Video proof' : 'Photo proof' }}</p>
                @if ($isVideo)
                    <video src="{{ $a['mediaUrl'] }}" controls class="w-full rounded-xl"></video>
                @else
                    <img src="{{ $a['mediaUrl'] }}" alt="Submitted proof" class="{{ $mediaBox }} rounded-xl">
                @endif
            </div>
        @endif

        @if (! empty($a['textContent']))
            <div>
                <p class="mb-1 text-xs font-extrabold uppercase tracking-wide text-[#52796f]">Written answer</p>
                <x-rich-text :value="$a['textContent']" />
            </div>
        @endif

        @if (count($questions))
            <div>
                <p class="mb-1 text-xs font-extrabold uppercase tracking-wide text-[#52796f]">
                    Quiz answers{{ ! is_null($a['quizScore'] ?? null) ? ' · '.$a['quizScore'].'%' : '' }}
                </p>
                <div class="space-y-2">
                    @foreach ($questions as $index => $question)
                        @php
                            $picked = $quizAnswers[$index] ?? null;
                            $correct = $picked === ($question['answer'] ?? null);
                        @endphp
                        <div class="rounded-xl bg-white/70 p-3">
                            <p class="text-sm font-bold">{{ $question['q'] }}</p>
                            <p class="text-sm {{ $correct ? 'text-[#2d6a4f]' : 'text-[#c9184a]' }}">
                                {{ $correct ? '✓' : '✗' }} Answered: {{ $question['options'][$picked] ?? '—' }}
                            </p>
                            @unless ($correct)
                                <p class="text-xs text-[#52796f]">Correct: {{ $question['options'][$question['answer']] ?? '—' }}</p>
                            @endunless
                        </div>
                    @endforeach
                </div>
            </div>
        @endif

        @if (! empty($a['externalUrl']))
            <div>
                <p class="mb-1 text-xs font-extrabold uppercase tracking-wide text-[#52796f]">Attached link</p>
                <a href="{{ $a['externalUrl'] }}" target="_blank" rel="noopener noreferrer" class="inline-block break-all text-sm font-extrabold text-[#1d4e89] underline">{{ $a['externalUrl'] }} →</a>
            </div>
        @endif
    </div>
@endif
