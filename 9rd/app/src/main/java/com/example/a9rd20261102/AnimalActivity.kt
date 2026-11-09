package com.example.a9rd20261102

import android.os.Bundle
import android.view.View
import android.widget.ImageView
import androidx.appcompat.app.AppCompatActivity

class AnimalActivity : AppCompatActivity() {

    private val animals = listOf(
        R.drawable.cat, R.drawable.dog, R.drawable.lion, R.drawable.fox,
        R.drawable.elephant, R.drawable.giraffe, R.drawable.rabbit
    )
    private var index = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_animal)
    }

    fun onNextClick(view: View) {
        index = (index + 1) % animals.size  // 마지막 사진 다음엔 처음으로
        findViewById<ImageView>(R.id.animalImage).setImageResource(animals[index])
    }
}
