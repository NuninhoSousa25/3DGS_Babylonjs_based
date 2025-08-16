/* ========================================================================
   INFO PANEL COMPONENT
   ======================================================================== */

/**
 * Create info section HTML
 */
export function createInfoSection(hasTouch) {
    return `
        <div id="infoContent" class="content-section" style="display: none;">
            <h4>Controls</h4>
            
            <div class="info-group">
                <div class="info-title">Navigation</div>
                <ul class="info-list">
                    <li><span class="info-action">Left Click + Drag</span>: Orbit Camera</li>
                    <li><span class="info-action">Right Click + Drag</span>: Pan Camera</li>
                    <li><span class="info-action">Scroll</span>: Zoom In/Out</li>
                    <li><span class="info-action">Double Click</span>: Focus Point</li>
                </ul>
            </div>
            
            ${hasTouch ? `
            <div class="info-group">
                <div class="info-title">Touch Controls</div>
                <ul class="info-list">
                    <li><span class="info-action">One Finger Drag</span>: Orbit Camera</li>
                    <li><span class="info-action">Two Finger Drag</span>: Pan Camera</li>
                    <li><span class="info-action">Pinch</span>: Zoom In/Out</li>
                    <li><span class="info-action">Double Tap</span>: Focus Point</li>
                </ul>
            </div>` : ''}
            
            <div class="info-group">
                <div class="info-title">General</div>
                <ul class="info-list">
                    <li><span class="info-action">Auto Rotation</span>: Camera rotates after period of inactivity</li>
                    <li><span class="info-action">Reset View</span>: Returns to initial camera position</li>
                </ul>
            </div>
        </div>
    `;
}