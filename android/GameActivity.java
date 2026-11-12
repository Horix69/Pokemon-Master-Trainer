package br.local.mastertrainer;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.view.View;
import android.view.WindowManager;

public final class GameActivity extends Activity {
    private WebView game;
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        WindowManager.LayoutParams params = getWindow().getAttributes();
        params.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_NEVER;
        getWindow().setAttributes(params);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        game = new WebView(this);
        game.setBackgroundColor(0xff09283f);
        game.getSettings().setJavaScriptEnabled(true);
        game.getSettings().setDomStorageEnabled(true);
        game.getSettings().setAllowContentAccess(false);
        game.getSettings().setAllowFileAccess(false);
        game.getSettings().setAllowFileAccessFromFileURLs(false);
        game.getSettings().setAllowUniversalAccessFromFileURLs(false);
        game.getSettings().setMediaPlaybackRequiresUserGesture(false);
        game.getSettings().setUseWideViewPort(true);
        game.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return true;
            }
        });
        android.widget.FrameLayout frame = new android.widget.FrameLayout(this);
        frame.addView(game);
        frame.setOnApplyWindowInsetsListener((view,insets)->{
            android.view.DisplayCutout cut = insets.getDisplayCutout();
            view.setPadding(Math.max(insets.getSystemWindowInsetLeft(),cut==null?0:cut.getSafeInsetLeft()),
                Math.max(insets.getSystemWindowInsetTop(),cut==null?0:cut.getSafeInsetTop()),
                Math.max(insets.getSystemWindowInsetRight(),cut==null?0:cut.getSafeInsetRight()),
                Math.max(insets.getSystemWindowInsetBottom(),cut==null?0:cut.getSafeInsetBottom()));
            return insets.consumeSystemWindowInsets();
        });
        setContentView(frame);
        game.loadUrl("file:///android_asset/index.html");
    }
    @Override protected void onPause() {
        game.evaluateJavascript("document.getElementById('music')?.pause()",null);
        game.onPause(); game.pauseTimers(); super.onPause();
    }
    @Override protected void onResume() {
        super.onResume(); game.resumeTimers(); game.onResume();
    }
    @Override public void onBackPressed() {
        game.evaluateJavascript("(function(){const d=document.querySelector('#modal[open]')||[...document.querySelectorAll('dialog[open]')].pop();if(d){const x=d.querySelector('.diceClose,.receiptClose,.starterReveal button')||d.querySelector('#arenaHide,#close,#finishReview');if(x)x.click();else if(d.querySelector('#passDevice'))return true;else d.close();return true;}if(!document.querySelector('.welcome').hidden)return false;document.getElementById('backMenu').click();return true;})()",handled->{
            if(!"true".equals(handled))new AlertDialog.Builder(this).setMessage("Fechar Master Trainer?").setNegativeButton("Continuar",null).setPositiveButton("Fechar",(dialog,which)->finish()).show();
        });
    }
    @Override protected void onDestroy() { game.destroy(); super.onDestroy(); }
}


