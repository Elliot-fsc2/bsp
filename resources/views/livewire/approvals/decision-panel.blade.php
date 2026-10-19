<div class="space-y-3">
    <textarea
        wire:model="comment"
        rows="3"
        placeholder="Add a kind, useful note (optional)"
        class="w-full rounded-2xl border border-[#cfe0cb] px-3 py-2"
    ></textarea>

    <div class="flex flex-wrap justify-end gap-2">
        <button type="button" wire:click="decide('approved')" class="rounded-full bg-[#2d6a4f] px-5 py-3 text-sm font-bold text-white">Approve</button>
        <button type="button" wire:click="decide('rejected')" class="rounded-full px-5 py-3 text-sm font-bold text-white" style="background: #c1121f">Ask for revision</button>
    </div>
</div>
