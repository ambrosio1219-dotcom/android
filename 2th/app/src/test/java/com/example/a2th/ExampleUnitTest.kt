package com.example.a2th

import android.R
import android.util.Log
import org.junit.Test

import org.junit.Assert.*

/**
 * Example local unit test, which will execute on the development machine (host).
 *
 * See [testing documentation](http://d.android.com/tools/testing).
 */
class ExampleUnitTest {
    @Test
    fun addition_isCorrect() {
        assertEquals(4, 2 + 2)

//        val myName = "하지석"
//
//        val age: Int = 24
//
//        println("나이: " + age + "\n" + "이름: " + myName)
//
//        var numOne = 1
//        var numTwo = 30000000
//        var myByte: Byte = 1
//        var myInt: Int = 20
//
//        println(
//            "numOne: " + numOne + ", numTwo: " + numTwo +
//                    ", myByte: " + myByte + ", myInt: " + myInt
//        )
//
//        var myFloat: Float = 30.2F
//        var myDouble: Double = 35.4
//        var myBoolean: Boolean = true
//
//        println("Float: " + myFloat)
//        println("Double: " + myDouble)
//        println("Boolean: " + myBoolean)
//
//        var myChar1: Char = 'K'
//        var myChar2: Char = 'o'
//        var myChar3: Char = 't'
//        var myChar4: Char = 'l'
//        var myChar5: Char = 'i'
//        var myChar6: Char = 'n'
//
//        var myString1: String = "Kotlin"
//        var myString2: String = "Java"
//
//        println("Char: " + myChar1 + myChar2 + myChar3 + myChar4 + myChar5 + myChar6)
//        println("String: " + myString1)
//        println("String: " + myString2)
//
//        var myArray: IntArray = intArrayOf(1, 2, 3, 4, 5)
//        println("Array: " + myArray[2])

//        var myX: Int = 100
//        var myY: Float = myX.toFloat()
//        Log.d("코틀린 : 자료형 변환 ","Int : " + myX)
//        Log.d("코틀린 : 자료형 변환 ","Long : " + myY)

        var x: Int = 4
        var y: Int = 2
        println("코틀린 : 비교 연산자 x<y = " + (x < y))
        println("코틀린 : 비교 연산자 x>y = " + (x > y))
        println("코틀린 : 비교 연산자 x>=y = " + (x >= y))
        println("코틀린 : 비교 연산자 x<=y = " + (x <= y))
        println("코틀린 : 비교 연산자 x==y = " + (x == y))
        println("코틀린 : 비교 연산자 x!=y = " + (x != y))

        y += x
        println("코틀린 : 할당 연산자" + "y+=x =>y=" + y)

        y -= x
        println("코틀린 : 할당 연산자" + "y-=x =>y=" + y)

        y *= x
        println("코틀린 : 할당 연산자" + "y*=x =>y=" + y)

        y /= x
        println("코틀린 : 할당 연산자" + "y/=x =>y=" + y)

        y %= x
        println("코틀린 : 할당 연산자" + "y%=x =>y=" + y)


//        var num: Int = 10

//        if(num % 2 ==0){
//            println("코틀린 : if-else 조건문"+"숫자"+num + "은 짝수")
//        }else{
//            println("코틀린 : if-else 조건문"+"숫자"+num + "은 홀수")
//        }


//        var num: Int = -10
//        var result : String
//        if(num > 0){
//            result = "숫자"+num+"은 양수"
//        }else if(num == 0){
//            result="숫자"+num+"은 0"
//        }else{
//            result="숫자"+num+"은 음수"
//        }
//        println("코틀린: if-else if 조건문"+result)


//        var num:Int =-10
//        var result : String
//        if(num>0){
//            if(num % 2 ==0) {
//                result = "" + num + "음수"
//            }else{
//                result= ""+num+"짝수"
//            }
//        }else{
//            result=""+num+"홀수"
//        }


//        var day: Int=2
//        var result : String
//        when(day){
//            1 -> result = "Monday"
//            2 -> result = "tus"
//            3 -> result = "wed"
//            4 -> result = "thu"
//            5 -> result = "fri"
//            6 -> result = "sat"
//            7 -> result = "sun"
//            else -> result = "inv"
//        }
//        println("코틀린:when 조건문"+result)
//
//
//        for(i in 5 downTo 1 step 2){
//            println("코틀린: for 반목문"+"반복 변수 : " + i)
//        }
//
//        var numbers = arrayOf(1,2,3,4,5)
//        for(i in numbers){
//            if(i % 2 ==1){
//                println(""+""+1)
//            }
//        }

//        var attendance: Int = 85
//        var score: Int = 96
//
//        if (attendance < 80) {
//            println("F (낙제)")
//        } else {
//            if (score >= 90) {
//                println("A 학점")
//                if (score >= 95) {
//                    println("A+ 장학생 선발 대상")
//                }
//            } else if (score >= 80) {
//                println("B 학점")
//            } else if (score >= 70) {
//                println("C 학점")
//            } else {
//                println("F 학점")
//            }
//        }
//
        for (i in 10..13) {

            for (j in 5..9) {
                print("" + i + " x " + j + " = " + (i * j))
            }
        }

    }
}
