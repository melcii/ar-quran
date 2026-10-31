package org.erguvan.arquran;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

/** Shows a 3D scene using the web pages bundled in the app's assets. */
public class SceneActivity extends Activity {

    private static final String EXTRA_SCENE_ID = "scene_id";
    // WebViewAssetLoader serves the bundled assets from this https address,
    // so the pages can load their JavaScript modules as they do on the website.
    private static final String ASSETS_URL = "https://" + WebViewAssetLoader.DEFAULT_DOMAIN + "/assets/";

    private WebView webView;

    static Intent intent(Context context, String sceneId) {
        return new Intent(context, SceneActivity.class).putExtra(EXTRA_SCENE_ID, sceneId);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String page = "index.html";
        String sceneId = getIntent().getStringExtra(EXTRA_SCENE_ID);
        Uri link = getIntent().getData();
        if (link != null) {
            sceneId = SceneLinks.sceneId(link.toString());
            if (sceneId == null) {
                Toast.makeText(this, R.string.not_ar_quran_code, Toast.LENGTH_LONG).show();
                finish();
                return;
            }
        }
        if (sceneId != null) {
            page = "scene.html?id=" + sceneId;
        }

        WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }
        });
        setContentView(webView);
        webView.loadUrl(ASSETS_URL + page);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
