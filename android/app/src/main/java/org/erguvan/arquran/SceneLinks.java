package org.erguvan.arquran;

import android.net.Uri;

import java.util.regex.Pattern;

/** Reads the scene id out of the link stored in an AR Quran QR code. */
final class SceneLinks {

    private static final Pattern SCENE_ID = Pattern.compile("[a-z0-9-]{1,64}");

    private SceneLinks() {
    }

    /**
     * Accepts links like {@code https://melcii.github.io/ar-quran/scene.html?id=noah-ark}.
     * Only the {@code id} is used, so codes keep working if the website moves.
     * Returns null when the text is not an AR Quran link.
     */
    static String sceneId(String text) {
        if (text == null) {
            return null;
        }
        Uri uri = Uri.parse(text.trim());
        String path = uri.getPath();
        if (path == null || !path.endsWith("/scene.html")) {
            return null;
        }
        String id = uri.getQueryParameter("id");
        return id != null && SCENE_ID.matcher(id).matches() ? id : null;
    }
}
