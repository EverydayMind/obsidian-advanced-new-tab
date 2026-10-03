<script lang="ts">
    let filename: string
    let filePath: string
    let fileDesc: string
</script>

<div class="suggestion-item mod-complex">
    <div class="suggestion-content">
        <div class="suggestion-icon">

        </div>
        <div class="suggestion-title advanced-new-tab-suggestion-title">
            {filename}
        </div>
        <div class="advanced-new-tab-suggestion-description">
            <div></div>
            <span>{fileDesc}</span>
        </div>
    </div>
    <div class="suggestion-aux">
        <div class="advanced-new-tab-suggestion-filepath">
            <div></div>
            <span class="advanced-new-tab-file-path">{filePath}</span>
        </div>
    </div>
</div>